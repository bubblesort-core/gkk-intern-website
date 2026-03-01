import { createClient } from "@supabase/supabase-js";

// Use reverse proxy for API since direct URL gets blocked by CORS or timeouts.
// We remove WebSockets (Realtime) since the proxy doesn't handle them reliably
const supabaseUrl = window.location.origin + '/supabase-main';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: async (url, options) => {
            const response = await fetch(url, options);
            if (response.status === 429) {
                // Rate limit exceeded
            }
            return response;
        }
    }
});

// Type for form data (what the form collects)
export interface FormSubmission {
    id?: string; // UUID
    full_name?: string;
    email?: string;
    phone?: string;
    whatsapp_number?: string;
    age?: string;
    sex?: string;
    college?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    cv_filename?: string;
    cv_url?: string;
    interests?: string[];
    interview_date?: string;
    interview_time?: string;
    interview_time_alternate?: string;
    discovery_source?: string;
    is_email_verified?: boolean;
    mascot_emotion?: 'neutral' | 'typing' | 'excited' | 'thinking' | 'curious' | 'angry';
    slot_hold_id?: string; // Temporary hold ID for movie-style slot reservation
    created_at?: string;
}

// Type for database record (what gets stored)
interface ApplicationRecord {
    full_name?: string;
    email: string;
    phone?: string;
    whatsapp_number?: string;
    age?: string;
    sex?: string;
    college?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    resume_url?: string; // cv_url maps to resume_url
    skills?: string[]; // interests maps to skills
    preferred_interview_date?: string;
    preferred_interview_time?: string;
    alternative_interview_time?: string;
    discovery_source?: string;
    status: string;
}

// Upload file to Supabase Storage with record ID as filename
export async function uploadFileWithId(file: File, recordId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${recordId}.${fileExt}`;
    const filePath = `cv/${fileName}`;

    const { error } = await supabase.storage
        .from('intern-documents')
        .upload(filePath, file, { upsert: true });

    if (error) {
        throw error;
    }

    // Get public URL
    const { data } = supabase.storage
        .from('intern-documents')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

// Update record with CV URL
export async function updateCvUrl(recordId: string, cvUrl: string) {
    const { error } = await supabase
        .from("applications")
        .update({ resume_url: cvUrl })
        .eq('id', recordId);

    if (error) {
        throw error;
    }
}

// Submit form data to Supabase and return the record ID
export async function submitFormData(data: FormSubmission): Promise<string> {
    // Map form fields to database columns
    const record: ApplicationRecord = {
        full_name: data.full_name,
        email: data.email || '',
        phone: data.phone,
        whatsapp_number: data.whatsapp_number,
        age: data.age,
        sex: data.sex,
        college: data.college,
        linkedin_url: data.linkedin_url,
        github_url: data.github_url,
        portfolio_url: data.portfolio_url,
        resume_url: data.cv_url,
        skills: data.interests,
        preferred_interview_date: data.interview_date,
        preferred_interview_time: data.interview_time,
        discovery_source: data.discovery_source,
        status: 'pending'
    };

    // Strip undefined/null values to avoid 400 errors from non-existent columns
    const cleanRecord = Object.fromEntries(
        Object.entries(record).filter(([, v]) => v !== undefined && v !== null)
    );

    const { data: result, error } = await supabase
        .from("applications")
        .insert([cleanRecord])
        .select('id')
        .single();

    if (error) {
        // Handle duplicate email specifically
        if (error.code === '23505') {
            throw new Error(`You have already applied with the email ${data.email}. Please wait for us to contact you.`);
        }
        throw error;
    }

    try {
        await supabase.functions.invoke('gkk-application-email', {
            body: {
                applicationData: {
                    ...data,
                    full_name: data.full_name || 'Candidate'
                }
            }
        });
    } catch (emailError) {
        // Silent fail for email trigger
    }

    return result.id;
}

// Form Settings interface for availability configuration
export interface FormSettings {
    available_days: number[];  // 0=Sunday, 1=Monday, 6=Saturday
    available_dates: string[]; // Specific dates in YYYY-MM-DD format
    time_slots: string[];      // 24h format like "18:00", "18:30"
    max_per_slot: number;      // Max applicants per time slot
    is_form_locked: boolean;
    lock_message: string;
}

// Fetch form settings from Supabase
export async function getFormSettings(): Promise<{ data: FormSettings | null, error: any }> {
    try {
        const { data, error } = await supabase
            .from('form_settings')
            .select('available_days, available_dates, time_slots, max_per_slot, is_form_locked, lock_message')
            .eq('id', '00000000-0000-0000-0000-000000000001')
            .single();

        if (error) {
            return { data: null, error };
        }

        return { data: data as FormSettings, error: null };
    } catch (err) {
        return { data: null, error: err };
    }
}

// Fetch active slot counts for a specific date (counts both 'held' and 'confirmed', excludes expired holds)
// Returns a map of time -> count (e.g. { "6:00 PM": 2, "6:15 PM": 1 })
export async function getBookedSlots(bookingDate: string): Promise<Record<string, number>> {
    try {
        const { data, error } = await supabase
            .from('slot_bookings')
            .select('booking_time, status, held_until')
            .eq('booking_date', bookingDate);

        if (error) {
            console.error('Error fetching booked slots:', error);
            return {};
        }

        const now = Date.now();
        const counts: Record<string, number> = {};
        (data || []).forEach((row: { booking_time: string; status: string; held_until: string | null }) => {
            // Skip expired holds
            if (row.status === 'held' && row.held_until && new Date(row.held_until).getTime() < now) return;
            counts[row.booking_time] = (counts[row.booking_time] || 0) + 1;
        });
        return counts;
    } catch (err) {
        console.error('Error fetching booked slots:', err);
        return {};
    }
}

// Hold a slot temporarily (5-minute TTL, like movie seat selection)
// Returns the hold ID if successful
const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function holdSlot(
    bookingDate: string,
    bookingTime: string,
    email: string,
    maxPerSlot: number
): Promise<{ success: boolean; holdId?: string; error?: string }> {
    try {
        const now = new Date().toISOString();

        // Clean up expired holds for this slot first
        await supabase
            .from('slot_bookings')
            .delete()
            .eq('booking_date', bookingDate)
            .eq('booking_time', bookingTime)
            .eq('status', 'held')
            .lt('held_until', now);

        // Count active bookings (confirmed + non-expired holds)
        const { data: existing, error: countError } = await supabase
            .from('slot_bookings')
            .select('id, status, held_until')
            .eq('booking_date', bookingDate)
            .eq('booking_time', bookingTime);

        if (countError) {
            return { success: false, error: countError.message };
        }

        const nowTime = Date.now();
        // Filter to active only (confirmed + non-expired holds)
        const activeCount = (existing || []).filter((row: { status: string; held_until: string | null }) => {
            if (row.status === 'confirmed') return true;
            if (row.status === 'held' && row.held_until && new Date(row.held_until).getTime() >= nowTime) return true;
            return false;
        }).length;

        if (activeCount >= maxPerSlot) {
            return { success: false, error: 'This time slot is already full. Please select a different time.' };
        }

        // Insert the temporary hold
        const heldUntil = new Date(Date.now() + HOLD_DURATION_MS).toISOString();
        const { data: inserted, error: insertError } = await supabase
            .from('slot_bookings')
            .insert([{
                booking_date: bookingDate,
                booking_time: bookingTime,
                applicant_email: email,
                status: 'held',
                held_until: heldUntil
            }])
            .select('id')
            .single();

        if (insertError) {
            return { success: false, error: insertError.message };
        }

        return { success: true, holdId: inserted?.id };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error holding slot' };
    }
}

// Confirm a held slot (converts hold -> confirmed, removes TTL)
export async function confirmSlot(holdId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const nowTime = Date.now();

        // Verify the hold still exists and hasn't expired
        const { data: hold, error: fetchError } = await supabase
            .from('slot_bookings')
            .select('id, status, held_until')
            .eq('id', holdId)
            .single();

        if (fetchError || !hold) {
            return { success: false, error: 'Hold not found. It may have expired. Please try again.' };
        }

        if (hold.status === 'confirmed') {
            return { success: true }; // Already confirmed
        }

        if (hold.held_until && new Date(hold.held_until).getTime() < nowTime) {
            // Hold expired — delete it
            await supabase.from('slot_bookings').delete().eq('id', holdId);
            return { success: false, error: 'Your hold has expired. Please select the time slot again.' };
        }

        // Upgrade to confirmed
        const { error: updateError } = await supabase
            .from('slot_bookings')
            .update({ status: 'confirmed', held_until: null })
            .eq('id', holdId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error confirming slot' };
    }
}

// Release a held slot (when user deselects or navigates away)
export async function releaseSlot(holdId: string): Promise<void> {
    try {
        await supabase
            .from('slot_bookings')
            .delete()
            .eq('id', holdId)
            .eq('status', 'held');
    } catch (err) {
        console.error('Error releasing slot:', err);
    }
}

// Hard-release a held slot during page unloads/refreshes explicitly using keepalive fetch
export function releaseSlotKeepalive(holdId: string): void {
    const url = `${supabaseUrl}/rest/v1/slot_bookings?id=eq.${holdId}&status=eq.held`;
    try {
        // Modern approach: POST with method override
        fetch(url, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'X-HTTP-Method-Override': 'DELETE'
            },
            keepalive: true // guarantees request completion even if tab closes
        }).catch(() => {
            // Fallback for strict browsers: Synchronous XHR (deprecated but works reliably on unload)
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('DELETE', url, false); // false = synchronous
                xhr.setRequestHeader('apikey', supabaseKey);
                xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
                xhr.send();
            } catch (xhrError) {
                // silent
            }
        });
    } catch (err) {
        // silent fail to avoid console spam during teardown
    }
}
