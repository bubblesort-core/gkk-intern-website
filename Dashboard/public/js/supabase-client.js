// ============================================
// GKK INTERNS - SUPABASE CLIENT CONFIGURATION
// ============================================

// Check if already initialized to prevent double-loading errors
if (typeof window.supabaseClient === 'undefined') {
    // Use Proxy URLs to bypass ISP blocks
    window.SUPABASE_DIRECT_URL = 'https://hjpsyxqakzrhvzegehtm.supabase.co';
    window.SUPABASE_URL = window.location.origin + '/supabase-main';
    window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcHN5eHFha3pyaHZ6ZWdlaHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTI5NjMsImV4cCI6MjA4NDMyODk2M30.nfBtyd_doPQBkBfzHYtQ2q0yl1vf5y0QZPRrkHCOwAU';

    // Initialize Supabase client with persistent session
    const { createClient } = window.supabase;

    // Determine if we are in the Admin portal
    const isAdminPath = window.location.pathname.includes('/admin/');

    // Config options
    const clientOptions = {
        auth: {
            persistSession: true,
            storage: window.gkkCookieStorage || window.localStorage, // Fallback if cookie script missing
            autoRefreshToken: true,
            detectSessionInUrl: true
        },
        global: {
            fetch: async (url, options) => {
                const fetchUrl = url.toString().replace(window.SUPABASE_DIRECT_URL, window.SUPABASE_URL);
                const response = await fetch(fetchUrl, options);
                if (response.status === 429) {
                    console.error('⚠️ SUPABASE RATE LIMIT EXCEEDED (429):', fetchUrl);
                }
                // Detect auth failures (invalid/expired token) and handle gracefully
                if ((response.status === 401 || response.status === 403) && isAdminPath) {
                    // Check if this is an auth-related error (not just RLS deny)
                    try {
                        const cloned = response.clone();
                        const body = await cloned.json();
                        const msg = (body.message || body.error_description || body.msg || '').toLowerCase();
                        if (msg.includes('invalid') || msg.includes('expired') || msg.includes('token') || msg.includes('jwt') || msg.includes('not authenticated')) {
                            console.error('🔒 Admin auth token invalid/expired. Attempting recovery...');
                            // Try to refresh the session first
                            const { error: refreshError } = await window.supabaseClient?.auth?.refreshSession() || { error: true };
                            if (refreshError) {
                                // Refresh failed — session is dead, redirect to login
                                if (!window._adminAuthRedirecting) {
                                    window._adminAuthRedirecting = true;
                                    localStorage.removeItem('admin_session');
                                    alert('Your session has expired or another admin signed in. Please log in again.');
                                    window.location.replace('login.html');
                                }
                            }
                        }
                    } catch (parseErr) {
                        // Response wasn't JSON, ignore
                    }
                }
                return response;
            }
        }
    };

    // Use a separate storage key for Admin to prevent overwriting Student session
    if (isAdminPath) {
        clientOptions.auth.storageKey = 'gkk-admin-auth';
    }

    // Add direct realtime URL to bypass proxy issues
    // Note: In v2, this is derived from the service URL, so we initialize with Direct URL
    window.supabaseClient = createClient(window.SUPABASE_DIRECT_URL, window.SUPABASE_ANON_KEY, clientOptions);

    // Listen for auth state changes to handle session invalidation
    if (isAdminPath) {
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
                // Session was invalidated (e.g., another admin signed in and rotated the token)
                if (!window._adminAuthRedirecting && !window.location.pathname.includes('login.html')) {
                    console.warn('🔒 Auth session lost. Event:', event);
                    window._adminAuthRedirecting = true;
                    localStorage.removeItem('admin_session');
                    alert('Your session has ended. Please log in again.');
                    window.location.replace('login.html');
                }
            }
        });
    }

    // Helper to proxy storage URLs
    window.getProxiedUrl = (url) => {
        if (!url) return url;
        // Handle main project storage
        if (url.includes('hjpsyxqakzrhvzegehtm.supabase.co/storage/v1/object/public/')) {
            return url.replace('https://hjpsyxqakzrhvzegehtm.supabase.co/storage/v1/object/public/', window.location.origin + '/storage-main/');
        }
        // Handle chat project storage
        if (url.includes('mwnpwuxrbaousgwgoyco.supabase.co/storage/v1/object/public/')) {
            return url.replace('https://mwnpwuxrbaousgwgoyco.supabase.co/storage/v1/object/public/', window.location.origin + '/storage-chat/');
        }
        return url;
    };
} else {
    // Initialized successfully.
}

// Local reference for compatibility - check if already declared to avoid syntax error
// Note: const cannot be redeclared, so we use window property primarily.
// If this script is loaded twice, we just ensure initialization happened above.
if (!window.supabaseClient) {
    console.error('Supabase Client failed to initialize');
}

// ============================================
// AUTH HELPERS
// ============================================

async function getCurrentUser() {
    // getSession() will recover the session from local storage and refresh it if needed
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError) {
        console.error('Error restoring session:', sessionError);
        return null;
    }

    const expiresAt = localStorage.getItem('gkk_session_expiry');
    if (expiresAt && Date.now() > parseInt(expiresAt)) {
        await signOut();
        return null;
    }

    if (!session) {
        return null; // No session found
    }

    // Now get the user details to be sure (though session.user is usually sufficient)
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error('Error getting user:', error);
        // If getUser fails but we had a session, it might be invalid now
        return null;
    }
    return user;
}

async function getCurrentProfile() {
    // Always get fresh user from Supabase Auth server (bypasses cached session)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        console.error('Error getting fresh user for profile:', userError);
        return null;
    }

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (error) {
        console.error('Error getting profile:', error);
        return null;
    }
    return data;
}

async function isAdmin() {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data: admin, error } = await supabaseClient
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid error if not found

    return !!admin;
}

async function signOut() {
    // Clear admin session if exists
    localStorage.removeItem('admin_session');
    sessionStorage.removeItem('admin_identity'); // Reset identity check

    // Sign out locally only — do NOT invalidate the server-side session
    // so other admins sharing the same credential stay logged in
    try {
        await supabaseClient.auth.signOut({ scope: 'local' });
    } catch (e) {
        // Ignore errors
    }

    // Determine redirect path based on current location
    if (window.location.pathname.includes('/admin/')) {
        window.location.replace('login.html');
    } else {
        // Go to root landing page
        window.location.replace('../index.html');
    }
    return true;
}

// ============================================
// ADMIN SESSION HELPERS (Simple Auth)
// ============================================

function getAdminSession() {
    try {
        const session = localStorage.getItem('admin_session');
        if (!session) return null;

        const parsed = JSON.parse(session);
        // Check if session is expired
        if (parsed.expires && parsed.expires < Date.now()) {
            localStorage.removeItem('admin_session');
            return null;
        }
        return parsed;
    } catch (e) {
        localStorage.removeItem('admin_session');
        return null;
    }
}

function clearAdminSession() {
    localStorage.removeItem('admin_session');
}

/**
 * Ensures the admin has a valid Supabase Auth session.
 * Call this at the start of admin page init() functions.
 * If the session is invalid, attempts refresh. If refresh fails, redirects to login.
 * Returns true if session is valid, false if redirecting.
 */
async function ensureAdminAuth() {
    const adminSession = getAdminSession();
    if (!adminSession) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        // Check if Supabase auth session is still valid
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error || !session) {
            // Try to refresh
            const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
            if (refreshError || !refreshData?.session) {
                console.error('🔒 Admin auth session expired and refresh failed');
                localStorage.removeItem('admin_session');
                window.location.href = 'login.html';
                return false;
            }
        }
        return true;
    } catch (e) {
        console.error('🔒 Auth check failed:', e);
        localStorage.removeItem('admin_session');
        window.location.href = 'login.html';
        return false;
    }
}

// Force reload on back button (handle bfcache)
window.addEventListener('pageshow', (event) => {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        window.location.reload();
    }
});

// ============================================
// TEAM MANAGEMENT HELPERS
// ============================================

async function getAllTeams() {
    const { data, error } = await supabaseClient
        .from('teams')
        .select(`
            *,
            team_members (
                id,
                role,
                user_id,
                profiles (id, full_name, email, avatar_url)
            ),
            projects (id, title, status)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching teams:', error);
        return [];
    }
    return data;
}

async function createTeam(teamData) {
    const { data, error } = await supabaseClient
        .from('teams')
        .insert([teamData])
        .select()
        .single();

    if (error) {
        console.error('Error creating team:', error);
        throw error;
    }
    return data;
}

async function deleteTeam(teamId) {
    const { error } = await supabaseClient
        .from('teams')
        .delete()
        .eq('id', teamId);

    if (error) {
        console.error('Error deleting team:', error);
        throw error;
    }
    return true;
}

async function addMemberToTeam(teamId, userId, role = 'member') {
    const { data, error } = await supabaseClient
        .from('team_members')
        .insert([{ team_id: teamId, user_id: userId, role }])
        .select()
        .single();

    if (error) {
        console.error('Error adding member:', error);
        throw error;
    }
    return data;
}

async function removeMemberFromTeam(teamId, userId) {
    const { error } = await supabaseClient
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error removing member:', error);
        throw error;
    }
    return true;
}

// ============================================
// APPLICATION HELPERS
// ============================================

async function getAllApplications(status = null) {
    let query = supabaseClient
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching applications:', error);
        return [];
    }
    return data;
}

async function updateApplicationStatus(applicationId, status, notes = null) {
    const updateData = { status };
    if (notes) updateData.interview_notes = notes;

    const { data, error } = await supabaseClient
        .from('applications')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();

    if (error) {
        console.error('Error updating application:', error);
        throw error;
    }
    return data;
}

// ============================================
// PROJECT HELPERS
// ============================================

async function getAllProjects() {
    const { data, error } = await supabaseClient
        .from('projects')
        .select(`
            *,
            teams (id, name, current_members),
            project_submissions (id, status, submitted_at)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
    return data;
}

async function createProject(projectData) {
    const { data, error } = await supabaseClient
        .from('projects')
        .insert([projectData])
        .select()
        .single();

    if (error) {
        console.error('Error creating project:', error);
        throw error;
    }
    return data;
}

async function assignProjectToTeam(projectId, teamId) {
    const { data, error } = await supabaseClient
        .from('projects')
        .update({ assigned_team_id: teamId, status: 'assigned' })
        .eq('id', projectId)
        .select()
        .single();

    if (error) {
        console.error('Error assigning project:', error);
        throw error;
    }
    return data;
}

// ============================================
// INVITATION HELPERS
// ============================================

async function createInvitation(email, applicationId, teamId) {
    const user = await getCurrentUser();

    const { data, error } = await supabaseClient
        .from('invitations')
        .insert([{
            email,
            application_id: applicationId,
            team_id: teamId,
            created_by: user?.id
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating invitation:', error);
        throw error;
    }
    return data;
}

async function sendMagicLink(email) {
    const { data, error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: window.location.origin + '/user/login.html',
            shouldCreateUser: true
        }
    });

    if (error) {
        console.error('Error sending magic link:', error);
        throw error;
    }
    return data;
}

// ============================================
// USER & BATCH HELPERS
// ============================================

async function getAllInterns() {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('role', 'intern')
        .order('full_name');

    if (error) {
        console.error('Error fetching interns:', error);
        return [];
    }
    return data;
}

async function getAllBatches() {
    const { data, error } = await supabaseClient
        .from('batches')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching batches:', error);
        return [];
    }
    return data;
}

// ============================================
// ANNOUNCEMENT HELPERS
// ============================================

async function getAllAnnouncements() {
    const now = new Date().toISOString();
    const { data, error } = await supabaseClient
        .from('announcements')
        .select('*')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching announcements:', error);
        return [];
    }
    return data;
}

async function createAnnouncement(announcementData) {
    const user = await getCurrentUser();

    const { data, error } = await supabaseClient
        .from('announcements')
        .insert([{ ...announcementData, created_by: user?.id }])
        .select()
        .single();

    if (error) {
        console.error('Error creating announcement:', error);
        throw error;
    }
    return data;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
