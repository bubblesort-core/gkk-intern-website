
// Import Supabase Client from the globally loaded script (or use the one we just included in HTML)
// Since we used the CDN link in HTML, 'supabase' global object is available by default window.supabase
// But to use `createClient`, we typically access it via `supabase.createClient`

// Import Supabase Client from the globally loaded script

// DOM Elements
const initSection = document.getElementById('init-section');
const paymentSection = document.getElementById('payment-section');
const successSection = document.getElementById('success-section');
const payBtn = document.getElementById('pay-btn');
const errorMsg = document.getElementById('error-msg');
const amountVal = document.getElementById('amount-val');
const exactAmountDisplay = document.getElementById('exact-amount-display');
const qrCodeContainer = document.getElementById('qrcode');
const upiIntentLink = document.getElementById('upi-intent-link');
const timerDisplay = document.getElementById('timer');

// State
let enrollmentId = null;
let pollInterval = null;
let countdownInterval = null;

// Event Listeners
payBtn.addEventListener('click', initiatePayment);

async function initiatePayment() {
    const studentName = document.getElementById('studentName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    if (!studentName || !email || !phone) {
        showError("Please fill in all fields.");
        return;
    }

    setLoading(true);

    try {


        const { data: { user } } = await supabaseClient.auth.getUser();

        const { data, error } = await supabaseClient.functions.invoke('initiate-payment', {
            body: {
                studentName,
                email,
                phone,
                userId: user?.id // Pass the Auth ID
            }
        });

        if (error) throw error;
        if (!data) throw new Error("No data received from server");



        // Success
        enrollmentId = data.enrollmentId;
        showPaymentScreen(data.amount, data.upiString, data.expiresAt);

    } catch (err) {
        console.error(err);
        showError(err.message || "Failed to initiate payment. Please try again.");
    } finally {
        setLoading(false);
    }
}

function showPaymentScreen(amount, upiString, expiresAt) {
    // Hide Init, Show Payment
    initSection.classList.add('hidden');
    paymentSection.classList.remove('hidden');

    // Update UI
    const formattedAmount = amount.toFixed(2);
    amountVal.textContent = formattedAmount;
    exactAmountDisplay.textContent = `₹${formattedAmount}`;

    // Set UPI Link
    upiIntentLink.href = upiString;

    // Generate QR Code
    qrCodeContainer.innerHTML = ""; // Clear prev
    new QRCode(qrCodeContainer, {
        text: upiString,
        width: 180,
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Start Timer
    startTimer(new Date(expiresAt));

    // Start Polling
    startPolling();
}

function startPolling() {
    pollInterval = setInterval(async () => {
        if (!enrollmentId) return;


        const { data, error } = await supabaseClient
            .from('payments')
            .select('status')
            .eq('id', enrollmentId) // enrollmentId is the UUID returned by initiate-payment
            .single();

        if (error) {
            console.error("Polling error", error);
            return;
        }

        if (data.status === 'completed') {
            paymentVerified();
        } else if (data.status === 'failed') {
            clearInterval(pollInterval);
            showError("Payment marked as failed.");
        }
    }, 3000); // Check every 3 seconds
}

async function paymentVerified() {
    clearInterval(pollInterval);
    clearInterval(countdownInterval);

    // Record the payment in the 'payments' table for Admin Dashboard
    try {
        // Fetch enrollment details to get amount and currency if needed
        const { data: enrollment } = await supabaseClient
            .from('enrollments')
            .select('*')
            .eq('id', enrollmentId)
            .single();

        if (enrollment) {
            const { data: { user } } = await supabaseClient.auth.getUser();

            // Insert into payments table
            await supabaseClient
                .from('payments')
                .insert([{
                    user_id: user.id || enrollment.user_id,
                    amount: enrollment.amount || 100, // Fallback to 100 if null
                    currency: 'INR',
                    payment_id: enrollment.payment_id || 'manual_' + Date.now(),
                    status: 'completed',
                    customer_email: enrollment.email,
                    customer_name: enrollment.student_name
                }]);
        }
    } catch (e) {
        console.error("Failed to record payment stats:", e);
        // Don't block success flow for stats error
    }

    paymentSection.classList.add('hidden');
    successSection.classList.remove('hidden');

    setTimeout(() => {
        // Redirect to dashboard or login
        window.location.href = 'user/index.html';
    }, 3000);
}

function startTimer(endTime) {
    function update() {
        const now = new Date();
        const diff = endTime - now;

        if (diff <= 0) {
            clearInterval(countdownInterval);
            timerDisplay.textContent = "00:00";
            showError("Payment session expired. Please refresh.");
            clearInterval(pollInterval); // Stop polling
            return;
        }

        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        timerDisplay.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    update();
    countdownInterval = setInterval(update, 1000);
}

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
}

function setLoading(isLoading) {
    if (isLoading) {
        payBtn.textContent = "Processing...";
        payBtn.disabled = true;
        errorMsg.classList.add('hidden');
    } else {
        payBtn.textContent = "Pay & Enroll";
        payBtn.disabled = false;
    }
}
