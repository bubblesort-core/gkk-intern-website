import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { Redis } from "https://esm.sh/@upstash/redis"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const upstashUrl = Deno.env.get('UPSTASH_REDIS_REST_URL')
    const upstashToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')
    
    // If Redis is not configured properly yet, fallback to direct DB fetch to prevent breaking
    if (!upstashUrl || !upstashToken) {
      console.warn("Upstash Redis not configured. Falling back to direct database fetch.");
      return await fetchFromDatabase(req);
    }

    const redis = new Redis({
      url: upstashUrl,
      token: upstashToken,
    })

    const cacheKey = 'merchandise_products_active'
    
    // Parse body if available
    let body = {};
    try {
      if (req.method === 'POST') {
        body = await req.json();
      }
    } catch (e) {
      // ignore
    }

    if (body.clear_cache) {
      await redis.del(cacheKey);
      console.log('Cache cleared programmatically.');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // Try fetching from Redis first
    const cachedData = await redis.get(cacheKey)
    if (cachedData) {
      console.log('Cache hit! Returning products from Redis.');
      return new Response(
        JSON.stringify(cachedData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('Cache miss! Fetching from Postgres.');
    
    // Fetch from Postgres
    const response = await fetchFromDatabase(req);
    const responseData = await response.json();
    
    // Save to Redis (Set Expiration: 5 minutes = 300 seconds)
    // You can also clear this programmatically from the admin panel if desired
    if (response.status === 200) {
      await redis.set(cacheKey, responseData, { ex: 300 })
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function fetchFromDatabase(req: Request) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const { data, error } = await supabaseClient
    .from('merchandise_products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  )
}
