# Razorpay UPI/GPay Payment Integration Guide

This guide explains how to integrate Razorpay for accepting the ₹100 internship fee via UPI/GPay.

## Why Razorpay Instead of Direct GPay?

Google Pay (GPay) doesn't provide a direct merchant API for websites. To accept UPI payments programmatically, you need a payment gateway like:
- **Razorpay** (recommended - easiest integration)
- Paytm Payment Gateway
- PhonePe for Business
- Cashfree

Razorpay supports all UPI apps including GPay, PhonePe, Paytm, etc.

---

## Step 1: Create Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/signup)
2. Sign up with your business details
3. Complete KYC verification (takes 1-2 days)
4. Get your API keys from Settings → API Keys

---

## Step 2: Get API Keys

From your Razorpay Dashboard:
- **Key ID**: `rzp_test_xxxxxx` (test mode) or `rzp_live_xxxxxx` (live)
- **Key Secret**: Used for server-side verification

> ⚠️ Never expose your Key Secret in frontend code!

---

## Step 3: Create Supabase Edge Function

Create a file `supabase/functions/razorpay-order/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!

serve(async (req) => {
  try {
    const { user_id, application_id } = await req.json()

    // Create Razorpay order
    const orderData = {
      amount: 10000, // ₹100 in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        user_id,
        application_id,
        purpose: 'internship_fee'
      }
    }

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })

    const order = await response.json()

    if (!response.ok) {
      throw new Error(order.error?.description || 'Failed to create order')
    }

    // Save order to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase.from('payments').insert({
      user_id,
      application_id,
      razorpay_order_id: order.id,
      amount: 100,
      status: 'pending'
    })

    return new Response(JSON.stringify({
      order_id: order.id,
      amount: order.amount,
      key_id: RAZORPAY_KEY_ID
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

---

## Step 4: Payment Verification Function

Create `supabase/functions/razorpay-verify/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!

serve(async (req) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = await req.json()

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature')
    }

    // Update payment status
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: payment } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select()
      .single()

    // Update user profile status
    if (payment?.user_id) {
      await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', payment.user_id)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

---

## Step 5: Frontend Payment Button

Add this to your payment page:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>

<button id="payBtn" class="btn btn-primary btn-lg">
    <i class="fas fa-rupee-sign"></i> Pay ₹100 Registration Fee
</button>

<script>
async function initiatePayment() {
    // Create order
    const response = await fetch('/functions/v1/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: currentUser.id,
            application_id: applicationId
        })
    });

    const { order_id, amount, key_id } = await response.json();

    // Open Razorpay checkout
    const options = {
        key: key_id,
        amount: amount,
        currency: 'INR',
        name: 'GKK-Hire',
        description: 'Internship Registration Fee',
        order_id: order_id,
        handler: async function(response) {
            // Verify payment
            const verifyResponse = await fetch('/functions/v1/razorpay-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response)
            });

            if (verifyResponse.ok) {
                alert('Payment successful! Your dashboard will be activated shortly.');
                window.location.reload();
            } else {
                alert('Payment verification failed. Please contact support.');
            }
        },
        prefill: {
            name: currentProfile.full_name,
            email: currentProfile.email,
            contact: currentProfile.phone
        },
        theme: {
            color: '#6366f1'
        },
        // Enable UPI/GPay
        method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true
        }
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
}

document.getElementById('payBtn').addEventListener('click', initiatePayment);
</script>
```

---

## Step 6: Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref hjpsyxqakzrhvzegehtm

# Set secrets
supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxxxx
supabase secrets set RAZORPAY_KEY_SECRET=xxxxx

# Deploy functions
supabase functions deploy razorpay-order
supabase functions deploy razorpay-verify
```

---

## Testing

1. Use Razorpay's [Test Mode](https://razorpay.com/docs/payments/payments/test-mode/)
2. Test card: `4111 1111 1111 1111`
3. Test UPI: Any valid format like `success@razorpay`

---

## Cost

Razorpay charges:
- **UPI**: 0% (free for now)
- **Cards**: 2% + GST
- **Netbanking**: 2% + GST

For ₹100, the UPI payment will be free!

---

## Alternative: Simple UPI Intent (Without Gateway)

If you want a simpler (but less reliable) approach, you can use UPI Intent URLs:

```javascript
// This opens UPI apps but doesn't provide automatic verification
const upiUrl = `upi://pay?pa=your-merchant-vpa@bank&pn=GKK-Hire&am=100&cu=INR&tn=Internship Fee`;
window.location.href = upiUrl;
```

However, this requires manual payment verification (you check bank statement manually).

---

## Recommendation

Use Razorpay for:
✅ Automatic payment verification
✅ Professional checkout experience
✅ Support for all payment methods
✅ Easy refunds
✅ Transaction dashboard
