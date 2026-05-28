# Supabase Edge Function Setup - PANDAA Bot

## Summary of Changes

The PANDAA bot now has **secure, server-side database and AI access** with the following setup:

### ✅ Security Improvements
- Removed `VITE_GROQ_API_KEY` from all client `.env` files (not needed for frontend)
- Groq API calls only happen **server-side** in Supabase Edge Functions
- Application status queries use `SERVICE_ROLE_KEY` (server-only)
- All sensitive operations isolated from client code

### ✅ Enhanced Error Handling
- Better retry logic for database RPC calls
- Graceful fallbacks when status or knowledge queries fail
- Informative error messages (without exposing secrets)
- Structured logging with `[PANDAA]` prefix for debugging

### ✅ Database Query Support
- **Application Status**: `get_pandaa_application_status(email)` RPC function
- **Knowledge Search**: `search_pandaa_knowledge(query)` RPC function
- Both queries work through secure edge function

---

## Setup Instructions

### 1. Configure Supabase Edge Function Secrets

Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions** (or Secrets)

Add these environment variables:

```env
# REQUIRED: Supabase
SUPABASE_URL=https://hjpsyxqakzrhvzegehtm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<copy-from-supabase-settings>

# REQUIRED: Groq API
GROQ_API_KEY=REDACTED

# OPTIONAL: Redis Caching
UPSTASH_REDIS_REST_URL=<your-redis-url>
UPSTASH_REDIS_REST_TOKEN=<your-redis-token>
```

**Note**: Use `SUPABASE_SERVICE_ROLE_KEY` from **Settings** → **API** → **Service role secret** (not the anon key)

### 2. Verify Client Env Files

All three apps now have clean `.env` files:
- ✅ `VITE_SUPABASE_URL` (public)
- ✅ `VITE_SUPABASE_ANON_KEY` (public, with RLS)
- ✅ `VITE_CONTACT_SCRIPT_URL` (public)
- ❌ No `VITE_GROQ_API_KEY` (removed)

### 3. Deploy Edge Function

```bash
# From project root
supabase functions deploy pandaa-assistant

# Or from the function directory
cd supabase/functions/pandaa-assistant
supabase functions deploy pandaa-assistant
```

---

## How It Works

### Request Flow
```
Client: "What's my application status?"
   ↓
PandaaBotCore calls: supabase.functions.invoke('pandaa-assistant', {
  prompt: "What's my application status?",
  email: "user@gmail.com",
  userName: "John"
})
   ↓
Edge Function (pandaa-assistant):
  - Uses SERVICE_ROLE_KEY (never exposed to client)
  - Calls RPC: get_pandaa_application_status('user@gmail.com')
  - Database returns: { full_name, status, remark }
  - Calls Groq API: Creates AI response
  - Caches result in Redis
  - Returns: { success: true, response: "Your status is..." }
   ↓
Client receives response (no secrets exposed)
```

### Database Queries

**Get Application Status**
```sql
-- Called automatically when user asks about status
SELECT * FROM public.get_pandaa_application_status('user@gmail.com');
-- Returns: full_name, status, remark, applied_at
```

**Search Knowledge Base**
```sql
-- Called for FAQ-style questions
SELECT * FROM public.search_pandaa_knowledge('internship duration');
-- Returns: instruction, response, rank
```

---

## Testing

### Local Testing
```bash
# Start edge functions locally
supabase functions serve

# Test the function
curl -X POST http://localhost:54321/functions/v1/pandaa-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What'\''s my application status?",
    "email": "test@gmail.com",
    "userName": "TestUser"
  }'
```

### Production Testing
1. Open any app with the bot (GKK-HIRE-MAIN, gkk-bento-form, or Dashboard)
2. Open bot and ask: "What's my application status for test@gmail.com?"
3. Bot should:
   - Query the database
   - Return status if record exists
   - Or politely say no record found

### View Logs
**Supabase Dashboard** → **Edge Functions** → `pandaa-assistant` → **Logs**

Look for `[PANDAA]` prefixed messages:
```
[PANDAA] Processing chat request from John
[PANDAA] Status found for: tes...
[PANDAA] Knowledge match found with rank: 0.85
[PANDAA] Cache hit
[PANDAA] Request successful
```

---

## Troubleshooting

### Issue: "GROQ_API_KEY is not configured"
**Solution**: 
1. Go to Supabase Settings → Edge Functions or Secrets
2. Add `GROQ_API_KEY` environment variable
3. Redeploy the function

### Issue: Bot doesn't return application status
**Solution**:
1. Check: Email is in database's `applications` table
2. Verify: `get_pandaa_application_status` RPC function works:
   ```sql
   SELECT * FROM public.get_pandaa_application_status('user@gmail.com');
   ```
3. Check edge function logs for errors

### Issue: "Status query too slow"
**Solution**: 
1. Verify Redis is configured (optional for caching)
2. Check database indexes on `applications(email)`
3. Add index if missing:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
   ```

### Issue: Keys exposed in bundle
**Solution**:
1. Verify no `VITE_GROQ_API_KEY` in `.env` files
2. Rebuild: `npm run build`
3. Check bundle: `grep -r "gsk_" dist/ || echo "Safe"`

---

## Security Checklist

- ✅ `GROQ_API_KEY` stored in Supabase secrets only (not client)
- ✅ `SERVICE_ROLE_KEY` stored in Supabase secrets only (not client)
- ✅ Client-side anon key has RLS policies protecting data
- ✅ Edge function validates input (max 5000 chars)
- ✅ Error messages don't expose internal details
- ✅ No API keys in source code or built bundles
- ✅ All database queries go through RLS-protected functions

---

## Environment Variables Summary

| Variable | Location | Scope | Use |
|----------|----------|-------|-----|
| `VITE_SUPABASE_URL` | `.env` (client) | Frontend | Database URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` (client) | Frontend | Sessions, history, inquiries |
| `VITE_CONTACT_SCRIPT_URL` | `.env` (client) | Frontend | Contact form |
| `GROQ_API_KEY` | Supabase Secrets | Edge Function | LLM API |
| `SUPABASE_URL` | Supabase Secrets | Edge Function | Database (auto-provided) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secrets | Edge Function | Full DB access |
| `UPSTASH_REDIS_REST_URL` | Supabase Secrets | Edge Function | Cache (optional) |
| `UPSTASH_REDIS_REST_TOKEN` | Supabase Secrets | Edge Function | Cache auth (optional) |

---

**Status**: ✅ Production Ready
**Last Updated**: April 2, 2026
