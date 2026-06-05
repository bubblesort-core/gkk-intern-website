// Razorpay Training Fee Payment Logic


// Success Animation Logic
function showPaymentSuccessAnimation() {
    const overlay = document.getElementById('processing');
    const progressBar = overlay.querySelector('.loading-bar span');

    // 1. Show Overlay
    overlay.classList.add('active');
    overlay.classList.add('uncomplete'); // Start with gears

    let progressAmount = 0;

    // 2. Animate Progress Bar
    setTimeout(function () {
        const interval = setInterval(function () {
            progressAmount += 10;
            progressBar.style.width = progressAmount + "%";

            if (progressAmount >= 100) {
                setTimeout(function () {
                    clearInterval(interval);

                    // 3. Switch to Checkmark
                    overlay.classList.remove('uncomplete');
                    overlay.classList.add('complete');

                    // Update Text to Success
                    overlay.querySelector('h1').textContent = "Payment Verified!";
                    overlay.querySelector('h2').textContent = "Redirecting to dashboard...";

                    // 4. Reload after checkmark animation (approx 3s)
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);

                }, 300);
            }
        }, 300);
    }, 500);
}

async function initiateTrainingPayment() {
    const payBtn = document.getElementById('payBtn');
    const originalText = payBtn.innerHTML;

    try {
        // 1. Show Loading State
        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        // 2. Get User Details
        // Use the global supabaseClient defined in supabase-client.js
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            throw new Error("User not logged in");
        }

        // Get profile data for prefill
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('full_name, email, phone')
            .eq('id', user.id)
            .single();

        // 3. Create Order via Backend
        const response = await fetch(window.location.origin + '/supabase-main/functions/v1/razorpay-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}` // Using anon key from global config
            },
            body: JSON.stringify({
                user_id: user.id,
                email: profile?.email || user.email,
                phone: profile?.phone || '',
                full_name: profile?.full_name || '',
                application_id: 'training_fee_unlock', // Static ID for this purpose
                amount: 50929 // Production Amount: 50929 paise = 509.29 INR
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create order');
        }

        const orderData = await response.json();

        // 4. Open Razorpay Checkout
        const options = {
            key: orderData.key, // Key returned from backend
            amount: orderData.amount,
            currency: orderData.currency,
            name: "GKK INTERN",
            description: "Training Fee (₹499) + Gateway Charges",
            image: "https://gkkintern.site/assets/gkk-intern-logo.png", // Ensure valid logo URL
            order_id: orderData.order_id,
            handler: async function (response) {
                // 5. Payment Success - Verify on Backend
                payBtn.innerHTML = '<i class="fas fa-check"></i> Verifying...';

                try {
                    const verifyResp = await fetch(window.location.origin + '/supabase-proxy/functions/v1/razorpay-verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    });

                    if (verifyResp.ok) {
                        // REPLACE SWAL WITH ANIMATION
                        showPaymentSuccessAnimation();

                    } else {
                        throw new Error("Payment verification failed on server");
                    }
                } catch (verifyError) {
                    console.error(verifyError);
                    Swal.fire({
                        icon: 'error',
                        title: 'Verification Failed',
                        text: 'Payment was successful but verification failed. Please contact support.',
                    });
                    payBtn.disabled = false;
                    payBtn.innerHTML = originalText;
                }
            },
            prefill: {
                name: orderData.prefill.name,
                email: orderData.prefill.email,
                contact: orderData.prefill.contact
            },
            theme: {
                color: "#10b981"
            },
            modal: {
                ondismiss: function () {
                    payBtn.disabled = false;
                    payBtn.innerHTML = originalText;
                }
            }
        };

        const rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', function (response) {
            console.error(response.error);
            Swal.fire({
                icon: 'error',
                title: 'Payment Failed',
                text: response.error.description || 'Transaction failed. Please try again.',
            });
            payBtn.disabled = false;
            payBtn.innerHTML = originalText;
        });

        rzp1.open();

    } catch (error) {
        console.error("Payment initiation error:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: error.message || 'Something went wrong while initializing payment.',
        });
        payBtn.disabled = false;
        payBtn.innerHTML = originalText;
    }
}
