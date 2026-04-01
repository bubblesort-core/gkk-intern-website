import { createClient } from "@supabase/supabase-js";

// Use reverse proxy for API since direct URL gets blocked by CORS or timeouts.
// We remove WebSockets (Realtime) since the proxy doesn't handle them reliably
const supabaseDirectUrl = 'https://hjpsyxqakzrhvzegehtm.supabase.co';
const supabaseProxyUrl = window.location.origin + '/supabase-main';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseDirectUrl, supabaseKey, {
    global: {
        fetch: async (url, options) => {
            const fetchUrl = url.toString().replace(supabaseDirectUrl, supabaseProxyUrl);
            return fetch(fetchUrl, options);
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
    batch_number?: string;
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
    batch_number?: string;
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
        batch_number: data.batch_number || 'Phase 1',
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
    specific_date_times?: Record<string, string[]>; // Map of YYYY-MM-DD to custom time slots
    time_slots: string[];      // 24h format like "18:00", "18:30"
    max_per_slot: number;      // Max applicants per time slot
    active_batch: string;      // Current recruitment batch
    is_form_locked: boolean;
    lock_message: string;
}

// Fetch form settings from Supabase
export async function getFormSettings(): Promise<{ data: FormSettings | null, error: any }> {
    try {
        const { data, error } = await supabase
            .from('form_settings')
            .select('available_days, available_dates, specific_date_times, time_slots, max_per_slot, active_batch, is_form_locked, lock_message')
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

// Fetch active slot counts for a specific date
// Counts from TWO sources:
//   1. Active holds/confirmed entries in `slot_bookings` (temporary reservations)
//   2. Submitted applications in `applications` table (permanent bookings)
// This ensures slots stay booked even after hold entries expire/get cleaned up.
// Returns a map of time -> count (e.g. { "6:00 PM": 2, "6:15 PM": 1 })
export async function getBookedSlots(bookingDate: string): Promise<Record<string, number>> {
    try {
        const now = new Date().toISOString();

        // Clean up ALL expired holds for this date (prevents ghost entries from accumulating)
        await supabase
            .from('slot_bookings')
            .delete()
            .eq('booking_date', bookingDate)
            .eq('status', 'held')
            .lt('held_until', now);

        // Source 1: Active holds and confirmed entries in slot_bookings
        const { data: slotData, error: slotError } = await supabase
            .from('slot_bookings')
            .select('booking_time')
            .eq('booking_date', bookingDate);

        if (slotError) {
            console.error('Error fetching slot_bookings:', slotError);
        }

        // Source 2: Submitted applications (the real source of truth for permanent bookings)
        const { data: appData, error: appError } = await supabase
            .from('applications')
            .select('preferred_interview_time')
            .eq('preferred_interview_date', bookingDate);

        if (appError) {
            console.error('Error fetching applications:', appError);
        }

        // Merge counts from both sources
        const counts: Record<string, number> = {};

        // Count from applications (permanent bookings — always take priority)
        (appData || []).forEach((row: { preferred_interview_time: string }) => {
            if (row.preferred_interview_time) {
                counts[row.preferred_interview_time] = (counts[row.preferred_interview_time] || 0) + 1;
            }
        });

        // Count active holds from slot_bookings (but ONLY 'held' status — confirmed entries should
        // already be reflected in the applications table since confirmSlot runs before submitFormData)
        (slotData || []).forEach((row: { booking_time: string }) => {
            counts[row.booking_time] = (counts[row.booking_time] || 0) + 1;
        });

        return counts;
    } catch (err) {
        console.error('Error fetching booked slots:', err);
        return {};
    }
}

// Hold a slot temporarily (5-minute TTL, like movie seat selection)
// Returns the hold ID and held_until timestamp for client-side timer sync
const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function holdSlot(
    bookingDate: string,
    bookingTime: string,
    email: string,
    maxPerSlot: number
): Promise<{ success: boolean; holdId?: string; heldUntil?: string; error?: string }> {
    try {
        const now = new Date().toISOString();

        // Clean up ALL expired holds for this entire DATE (not just this time slot)
        // This prevents ghost entries from accumulating across all slots
        await supabase
            .from('slot_bookings')
            .delete()
            .eq('booking_date', bookingDate)
            .eq('status', 'held')
            .lt('held_until', now);

        // Also clean up any existing holds by this same email on this date
        // (prevents duplicate holds if user switches slots without proper release)
        await supabase
            .from('slot_bookings')
            .delete()
            .eq('booking_date', bookingDate)
            .eq('applicant_email', email)
            .eq('status', 'held');

        // Count active bookings for this specific slot from BOTH sources
        // Source 1: slot_bookings (active holds)
        const { data: existing, error: countError } = await supabase
            .from('slot_bookings')
            .select('id')
            .eq('booking_date', bookingDate)
            .eq('booking_time', bookingTime);

        if (countError) {
            return { success: false, error: countError.message };
        }

        // Source 2: applications table (submitted/permanent bookings)
        const { data: appExisting } = await supabase
            .from('applications')
            .select('id')
            .eq('preferred_interview_date', bookingDate)
            .eq('preferred_interview_time', bookingTime);

        const activeCount = (existing || []).length + (appExisting || []).length;

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
            .select('id, held_until')
            .single();

        if (insertError) {
            return { success: false, error: insertError.message };
        }

        return { success: true, holdId: inserted?.id, heldUntil: inserted?.held_until };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error holding slot' };
    }
}

// Confirm a held slot (converts hold -> confirmed, removes TTL)
// If the hold expired, attempts to re-acquire the slot directly as confirmed
export async function confirmSlot(
    holdId: string,
    bookingDate?: string,
    bookingTime?: string,
    email?: string,
    maxPerSlot?: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const nowTime = Date.now();

        // Verify the hold still exists and hasn't expired
        const { data: hold, error: fetchError } = await supabase
            .from('slot_bookings')
            .select('id, status, held_until, booking_date, booking_time, applicant_email')
            .eq('id', holdId)
            .single();

        if (fetchError || !hold) {
            // Hold not found — try to re-acquire directly as confirmed
            if (bookingDate && bookingTime && email && maxPerSlot) {
                return await directConfirm(bookingDate, bookingTime, email, maxPerSlot);
            }
            return { success: false, error: 'Hold not found. It may have expired. Please select the time slot again.' };
        }

        if (hold.status === 'confirmed') {
            return { success: true }; // Already confirmed
        }

        if (hold.held_until && new Date(hold.held_until).getTime() < nowTime) {
            // Hold expired — delete it and try to re-acquire
            await supabase.from('slot_bookings').delete().eq('id', holdId);

            // Attempt to re-acquire directly as confirmed
            const reDate = bookingDate || hold.booking_date;
            const reTime = bookingTime || hold.booking_time;
            const reEmail = email || hold.applicant_email;
            const reMax = maxPerSlot || 1;
            return await directConfirm(reDate, reTime, reEmail, reMax);
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

// Direct confirm: insert a confirmed booking if capacity allows (used as fallback when hold expires)
async function directConfirm(
    bookingDate: string,
    bookingTime: string,
    email: string,
    maxPerSlot: number
): Promise<{ success: boolean; error?: string }> {
    try {
        // Clean up expired holds first
        const now = new Date().toISOString();
        await supabase
            .from('slot_bookings')
            .delete()
            .eq('booking_date', bookingDate)
            .eq('status', 'held')
            .lt('held_until', now);

        // Check capacity from BOTH sources
        // Source 1: slot_bookings
        const { data: existing } = await supabase
            .from('slot_bookings')
            .select('id')
            .eq('booking_date', bookingDate)
            .eq('booking_time', bookingTime);

        // Source 2: applications
        const { data: appExisting } = await supabase
            .from('applications')
            .select('id')
            .eq('preferred_interview_date', bookingDate)
            .eq('preferred_interview_time', bookingTime);

        const totalCount = (existing || []).length + (appExisting || []).length;

        if (totalCount >= maxPerSlot) {
            return { success: false, error: 'This slot was taken while your hold expired. Please select a different time.' };
        }

        // Insert directly as confirmed
        const { error: insertError } = await supabase
            .from('slot_bookings')
            .insert([{
                booking_date: bookingDate,
                booking_time: bookingTime,
                applicant_email: email,
                status: 'confirmed',
                held_until: null
            }]);

        if (insertError) {
            return { success: false, error: insertError.message };
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
    const url = `${supabaseProxyUrl}/rest/v1/slot_bookings?id=eq.${holdId}&status=eq.held`;
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
