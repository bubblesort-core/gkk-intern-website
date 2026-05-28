# PANDAA Bot - Environment Configuration Guide

## Overview
The PANDAA bot uses a **secure three-tier architecture** for environment variables to prevent API key exposure:

```
Client (Frontend) → Supabase Edge Function (Server) → External APIs
                   ↓
              Database (RLS Policies)
```

---

## 1. Client-Side Environment Variables

### Location
Each app has its own `.env` file:
- `GKK-HIRE-MAIN/.env`
- `gkk-bento-form/.env`
- `Dashboard/.env`

### Required Variables (Frontend Only)
```env
# Supabase - Public, Anon Key (Used for frontend access)
VITE_SUPABASE_URL=https://hjpsyxqakzrhvzegehtm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcHN5eHFha3pyaHZ6ZWdlaHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTI5NjMsImV4cCI6MjA4NDMyODk2M30.nfBtyd_doPQBkBfzHYtQ2q0yl1vf5y0QZPRrkHCOwAU

# Contact Form - Google Apps Script (for inquiry submission)
VITE_CONTACT_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx9RK4LFMYblIWeQGdQDJpvepjC4FJ22UqkwmQusFxxJF3qSMQDB8JEV1rSJP6GALc/exec

# Optional: Razorpay (not used by bot, but in apps)
VITE_RAZORPAY_KEY_ID=rzp_live_SJUXJsWdw9cbj6
```

### Security Notes
- ✅ `VITE_SUPABASE_ANON_KEY` is safe - it's designed for frontend use with RLS policies
- ✅ `VITE_CONTACT_SCRIPT_URL` is public - it's a Google Apps Script public endpoint
- ❌ **DO NOT add** `VITE_GROQ_API_KEY` (not needed on client)
- ❌ **DO NOT add** `SUPABASE_SERVICE_ROLE_KEY` (server-only)

---

## 2. Server-Side Environment Variables (Supabase Edge Functions)

### Location
Configure in **Supabase Dashboard** → Settings → Functions

### Required Secrets
```env
# Supabase - Service Role Key (Full Access)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Groq API - LLM Provider
GROQ_API_KEY=REDACTED

# Upstash Redis - Caching Layer (Optional)
UPSTASH_REDIS_REST_URL=<your-redis-url>
UPSTASH_REDIS_REST_TOKEN=<your-redis-token>

# Supabase - Automatically provided
SUPABASE_URL=https://hjpsyxqakzrhvzegehtm.supabase.co
```

### Security Notes
- 🔒 Service Role Key: **NEVER expose to clients**
- 🔒 Groq API Key: **Server-side only**, used in `pandaa-assistant` function
- 🔒 Redis Token: **Server-side only**, for caching responses

---

## 3. How It Works

### Flow Diagram

```
┌─────────────────────┐
│   Frontend Client   │
│  (PandaaBotCore)    │
└────────┬────────────┘
         │ payload: { prompt, email, userName }
         ↓
    ┌────────────────────────────────────┐
    │ Supabase Edge Function             │
    │ pandaa-assistant                   │
    │ (GROQ_API_KEY, SERVICE_ROLE_KEY)   │
    └────┬────────────────────────────────┘
         │
         ├─→ Database Query (RPC)
         │   - get_pandaa_application_status(email)
         │   - search_pandaa_knowledge(query)
         │
         ├─→ Groq API Call (Server-side)
         │   POST https://api.groq.com/openai/v1/chat/completions
         │   (No client exposure)
         │
         └─→ Redis Cache (optional)
             (For response caching)
         │
         ↓
    Response: { response: "..." }
         │
         ↓
┌─────────────────────────────────┐
│ Frontend receives AI response   │
│ (No secrets exposed)            │
└─────────────────────────────────┘
```

---

## 4. Database Access

### Application Status Query
**Location**: `supabase/functions/pandaa-assistant/index.ts`

```typescript
const { data: status } = await supabaseClient.rpc(
  'get_pandaa_application_status', 
  { p_email: email }
);
```

**RPC Function**: Defined in `pandaa_supabase_schema.sql`
```sql
CREATE OR REPLACE FUNCTION get_pandaa_application_status(p_email TEXT)
RETURNS TABLE (
  full_name TEXT,
  status TEXT,
  remark TEXT,
  applied_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT a.full_name, a.status, a.remark, a.created_at
  FROM public.applications a
  WHERE a.email = p_email
  ORDER BY a.created_at DESC
  LIMIT 1;
END;
$$;
```

### Knowledge Base Search
**RPC Function**: Defined in `chatbot_schema.sql`
```sql
CREATE OR REPLACE FUNCTION search_pandaa_knowledge(p_query TEXT)
RETURNS TABLE (
  instruction TEXT,
  response TEXT,
  rank FLOAT4
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT pk.instruction, pk.response,
         ts_rank(to_tsvector('english', pk.instruction || ' ' || pk.response),
                 plainto_tsquery('english', p_query)) as rank
  FROM public.pandaa_knowledge pk
  WHERE to_tsvector('english', pk.instruction || ' ' || pk.response) 
        @@ plainto_tsquery('english', p_query)
     OR pk.instruction ilike '%' || p_query || '%'
  ORDER BY rank DESC
  LIMIT 5;
END;
$$;
```

---

## 5. Setup Checklist

### For Development

- [ ] All `.env` files have `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_CONTACT_SCRIPT_URL` is set for inquiry submission
- [ ] No API keys starting with `VITE_` are sensitive (e.g., `VITE_GROQ_API_KEY` should NOT exist)
- [ ] Run `npm run build` to verify no environment warnings

### For Production (Supabase Dashboard)

- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in Edge Function secrets
- [ ] `GROQ_API_KEY` set in Edge Function secrets
- [ ] `UPSTASH_REDIS_REST_URL` and token set (optional, for caching)
- [ ] No keys are hardcoded in function source code
- [ ] RLS policies are enabled on all tables (see `pandaa_supabase_schema.sql`)

---

## 6. Testing

### Test Application Status Query
```bash
# Call the bot and ask about application status
# Example: "What's my application status for john@gmail.com?"

# The bot will:
# 1. Extract email from context
# 2. Call pandaa-assistant edge function
# 3. RPC queries get_pandaa_application_status(john@gmail.com)
# 4. Database returns: { full_name, status, remark }
# 5. Response is injected into AI prompt
# 6. Groq generates answer (server-side, no key exposed)
```

### Verify No Key Leakage
```bash
# Check built bundle for secrets
cd GKK-HIRE-MAIN && npx esbuild dist/index.js --bundle --analyze
# Search for "gsk_", "eyJ", "rzp_" - should NOT appear in build

# Local check
npm run build 2>&1 | grep -i "GROQ\|SERVICE_ROLE"
# Should return nothing
```

---

## 7. Troubleshooting

### Bot not responding?
1. Check Supabase Edge Function logs (Dashboard → Edge Functions → pandaa-assistant)
2. Verify `GROQ_API_KEY` is set in Supabase secrets
3. Test RPC functions directly:
   ```sql
   SELECT * FROM get_pandaa_application_status('test@gmail.com');
   SELECT * FROM search_pandaa_knowledge('internship');
   ```

### Application status not showing?
1. Ensure `applications` table exists in Supabase
2. Check RLS policy allows `get_pandaa_application_status` to read
3. Verify email matches exact value in DB

### Keys exposed in build?
1. Remove all `VITE_` prefixed API keys that shouldn't be public
2. Only keep `VITE_SUPABASE_ANON_KEY` and `VITE_CONTACT_SCRIPT_URL`
3. Rebuild: `npm run build && npm run preview`

---

## 8. Summary Table

| Variable | Location | Public? | Purpose |
|----------|----------|---------|---------|
| `VITE_SUPABASE_URL` | `.env` (client) | ✅ Yes | Frontend DB access |
| `VITE_SUPABASE_ANON_KEY` | `.env` (client) | ✅ Yes (w/ RLS) | Frontend DB queries |
| `VITE_CONTACT_SCRIPT_URL` | `.env` (client) | ✅ Yes | Inquiry submission |
| `GROQ_API_KEY` | Supabase Secrets | 🔒 No | Server-side AI |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secrets | 🔒 No | Server-side DB access |
| `UPSTASH_REDIS_REST_TOKEN` | Supabase Secrets | 🔒 No | Server-side caching |

---

**Last Updated**: April 2, 2026
**Status**: ✅ Production-Ready
