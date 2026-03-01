import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const userId = body.user_id as string | undefined;
    const emailRaw = body.email as string | undefined;
    const fullNameRaw = body.full_name as string | undefined;
    const referrerId = body.referrer_id as string | null | undefined;

    if (!userId || !emailRaw) {
      return new Response(JSON.stringify({ error: "Missing user_id or email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = emailRaw.trim().toLowerCase();

    // Fetch latest application data for this email
    const { data: apps, error: appError } = await supabase
      .from("applications")
      .select("status, full_name, skills, phone, college, year_of_study, portfolio_url, github_url")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (appError) {
      console.error("Application lookup failed:", appError);
      return new Response(JSON.stringify({ error: "Failed to verify application status" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const app = apps && apps.length > 0 ? apps[0] : null;

    if (!app || app.status !== "approved") {
      return new Response(JSON.stringify({ error: "Not approved for profile creation" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileData = {
      id: userId,
      email,
      full_name: app.full_name || fullNameRaw || "",
      skills: app.skills || [],
      phone: app.phone || null,
      college: app.college || null,
      year_of_study: app.year_of_study || null,
      portfolio_url: app.portfolio_url || null,
      github_url: app.github_url || null,
      status: "approved",
      role: "intern",
      referred_by: referrerId || null,
    };

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "id" });

    if (upsertError) {
      console.error("Profile upsert failed:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to create profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-profile error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
