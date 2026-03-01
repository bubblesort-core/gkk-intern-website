# Admin Security Implementation Guide

## ⚠️ Current Issue
Hardcoded credentials in client-side JavaScript are **visible to anyone** who views the page source. This is NOT production-ready.

## ✅ Secure Solution: Server-Side Validation

Use **Supabase Edge Functions** to validate credentials on the server where they're hidden from users.

---

## Step 1: Create Supabase Edge Function

Create a file `supabase/functions/admin-login/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// SECURE: Environment variables are server-side only
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')!
const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD')!

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { email, password } = await req.json()

    // Validate against secure server-side credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ 
        error: 'Invalid credentials' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create Supabase client with service role (server-side only)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Not an admin account')
    }

    // Return session token
    return new Response(JSON.stringify({
      success: true,
      session: data.session
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

---

## Step 2: Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref hjpsyxqakzrhvzegehtm

# Set secure environment variables (SERVER-SIDE ONLY)
supabase secrets set ADMIN_EMAIL=admin@gkk-hire.com
supabase secrets set ADMIN_PASSWORD=GKK@Admin2026

# Deploy the function
supabase functions deploy admin-login
```

---

## Step 3: Update Frontend (Secure Version)

Replace the admin login JavaScript with this **secure** version:

```javascript
// NO HARDCODED CREDENTIALS - All validation happens server-side
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    setLoading(loginBtn, true);

    try {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Call secure Edge Function (credentials validated server-side)
        const response = await fetch(
            'https://hjpsyxqakzrhvzegehtm.supabase.co/functions/v1/admin-login',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ email, password })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Login failed');
        }

        // Set session in Supabase client
        await supabase.auth.setSession(result.session);

        // Redirect to dashboard
        window.location.href = 'index.html';

    } catch (error) {
        showAlert(error.message);
    } finally {
        setLoading(loginBtn, false);
    }
});
```

---

## Additional Security Measures

### 1. Rate Limiting
Add to Edge Function:

```typescript
// At the top of your function
const rateLimitMap = new Map<string, number>();

serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Allow max 5 attempts per IP per minute
  const attempts = rateLimitMap.get(ip) || 0;
  if (attempts >= 5) {
    return new Response('Too many attempts. Try again later.', { 
      status: 429 
    });
  }
  rateLimitMap.set(ip, attempts + 1);
  
  // Clear after 1 minute
  setTimeout(() => rateLimitMap.delete(ip), 60000);
  
  // ... rest of function
});
```

### 2. IP Whitelisting (Optional)
```typescript
const ALLOWED_IPS = ['YOUR_OFFICE_IP', 'YOUR_HOME_IP'];

serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for');
  
  if (!ALLOWED_IPS.includes(ip)) {
    return new Response('Access denied', { status: 403 });
  }
  
  // ... rest of function
});
```

### 3. Two-Factor Authentication (Recommended)
Add TOTP-based 2FA using a library like `otplib`:

```typescript
import { authenticator } from 'https://esm.sh/otplib@12.0.1';

const ADMIN_TOTP_SECRET = Deno.env.get('ADMIN_TOTP_SECRET')!;

// In your login function
const { email, password, totpCode } = await req.json();

// Validate TOTP
const isValidToken = authenticator.verify({
  token: totpCode,
  secret: ADMIN_TOTP_SECRET
});

if (!isValidToken) {
  throw new Error('Invalid 2FA code');
}
```

---

## Why This is Secure

| Method | Security Level | Why |
|--------|---------------|-----|
| **Hardcoded (Current)** | 🔴 **Not Secure** | Visible in page source |
| **Edge Function** | 🟢 **Secure** | Credentials only on server |
| **+ Rate Limiting** | 🟢 **Very Secure** | Prevents brute force |
| **+ IP Whitelist** | 🟢 **Highly Secure** | Only specific IPs allowed |
| **+ 2FA** | 🟢 **Maximum Security** | Requires physical device |

---

## Quick Migration Checklist

- [ ] Create Edge Function file
- [ ] Set environment secrets in Supabase
- [ ] Deploy Edge Function
- [ ] Update frontend login code
- [ ] Test login functionality
- [ ] Add rate limiting
- [ ] (Optional) Add IP whitelisting
- [ ] (Optional) Add 2FA

---

## Cost
Supabase Edge Functions are **free** for the first 500K invocations/month, then $2 per 1M invocations.

For an admin login (used a few times per day), this will be **FREE**.
