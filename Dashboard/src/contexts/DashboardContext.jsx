import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const DashboardContext = createContext(null);

export function useDashboard() {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
    return ctx;
}

const slugify = (text) => {
    if (!text) return 'intern';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

export function DashboardProvider({ children }) {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [currentProfile, setCurrentProfile] = useState(null);
    const [currentTeam, setCurrentTeam] = useState(null);
    const [currentProjects, setCurrentProjects] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLocked, setIsLocked] = useState(true);
    const [loading, setLoading] = useState(true);
    const [profileSlug, setProfileSlug] = useState('');
    const pollingRef = useRef(null);

    // Helper: get proxied URL for Supabase storage
    const getProxiedUrl = useCallback((url) => {
        if (!url) return '';
        try {
            const u = new URL(url);
            return window.location.origin + '/supabase-main/storage/v1' + u.pathname.split('/storage/v1')[1];
        } catch {
            return url;
        }
    }, []);

    // Format date helper
    const formatDate = useCallback((dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    }, []);

    const formatDateTime = useCallback((dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 172800000) return 'Yesterday';
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }, []);

    // Leveling helpers (Now based on Streaks)
    const calculateLevel = useCallback((streak) => {
        if (!streak || streak <= 0) return 1;
        // Level up every 5 days of streak
        return 1 + Math.floor(streak / 5);
    }, []);

    // XP Awarding removed as per user request
    const awardXP = useCallback(async (userId, amount, reason) => {
        console.warn('XP system disabled. Awarding attempt for:', reason);
        return false;
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (e) { /* ignore */ }
        navigate('/user/login');
    }, [navigate]);

    // Daily Check-in Logic
    const handleDailyCheckIn = useCallback(async (profile) => {
        if (!profile || !profile.id || profile.role === 'admin') return profile;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastCheckInStr = profile.last_check_in;
        const lastCheckIn = lastCheckInStr ? new Date(lastCheckInStr) : null;
        
        if (lastCheckIn) {
            const lastDate = new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate());
            if (today.getTime() === lastDate.getTime()) {
                return profile;
            }
        }

        // It's a new day
        let newStreak = 1;

        if (lastCheckIn) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const lastDate = new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate());

            if (lastDate.getTime() === yesterday.getTime()) {
                newStreak = (profile.current_streak || 0) + 1;
            }
        }

        try {
            const newLevel = calculateLevel(newStreak);
            const updates = {
                current_streak: newStreak,
                last_check_in: now.toISOString(),
                level: newLevel,
                longest_streak: Math.max(profile.longest_streak || 0, newStreak)
            };

            const { error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', profile.id);

            if (updateError) throw updateError;

            // Show Toast
            const Swal = (await import('sweetalert2')).default;
            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false,
                timer: 5000, timerProgressBar: true,
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#f8fafc'
            });

            Toast.fire({
                icon: 'success',
                title: `🔥 Day ${newStreak} Streak!`,
                text: `You have reached Level ${newLevel}! Keep it up!`
            });

            return { ...profile, ...updates };
        } catch (error) {
            console.error('Error in daily check-in:', error);
            return profile;
        }
    }, []);

    // Poll for payment status
    const startPaymentPolling = useCallback(() => {
        if (pollingRef.current) return;
        pollingRef.current = setInterval(async () => {
            if (!currentUser) return;
            const { data } = await supabase.from('profiles').select('status').eq('id', currentUser.id).single();
            if (data?.status === 'active') {
                setIsLocked(false);
                setCurrentProfile(prev => prev ? { ...prev, status: 'active' } : prev);
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        }, 5000);
    }, [currentUser]);

    // Initialize
    useEffect(() => {
        let cancelled = false;

        async function init() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { navigate('/user/login'); return; }
                if (cancelled) return;
                setCurrentUser(user);

                const { data: adminData } = await supabase
                    .from('admins')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (adminData) {
                    setIsAdmin(true);
                    setCurrentProfile({
                        ...adminData,
                        role: 'admin',
                        status: 'active'
                    });
                    setIsLocked(false);
                    setProfileSlug(`admin-${user.id.split('-')[0]}`);
                    setLoading(false);
                    return;
                }

                if (cancelled) return;

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (!profile) {
                    // One last check for legacy admin session or newly promoted admin
                    const { data: legacyProfile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .maybeSingle();
                    
                    if (legacyProfile?.role === 'admin') {
                        setIsAdmin(true);
                        setCurrentProfile({ ...user, role: 'admin', status: 'active' });
                        setIsLocked(false);
                        setLoading(false);
                        return;
                    }

                    await supabase.auth.signOut({ scope: 'local' });
                    navigate('/user/login');
                    return;
                }
                if (cancelled) return;

                // Safety check
                if (profile.id !== user.id) {
                    const Swal = (await import('sweetalert2')).default;
                    await Swal.fire({ icon: 'error', title: 'Session Mismatch', text: 'Please log in again.' });
                    await supabase.auth.signOut({ scope: 'local' });
                    navigate('/user/login');
                    return;
                }

                const updatedProfile = await handleDailyCheckIn(profile);
                setCurrentProfile(updatedProfile);
                setProfileSlug(`${slugify(updatedProfile.full_name)}-${updatedProfile.id.split('-')[0]}`);
                const locked = updatedProfile.status !== 'active';
                setIsLocked(locked);

                if (!locked) {
                    // Load team
                    const { data: membership } = await supabase
                        .from('team_members')
                        .select('team_id, role, teams(id, name, description, is_active, batch_id, created_at, batches(name), projects(id, title, status))')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (!cancelled && membership?.teams) {
                        const team = membership.teams;
                        // Get team members
                        const { data: members } = await supabase
                            .from('team_members')
                            .select('id, user_id, role, profiles(id, full_name, email, avatar_url, github_url, linkedin_url)')
                            .eq('team_id', team.id);

                        team.team_members = members || [];
                        team.myRole = membership.role;
                        setCurrentTeam(team);
                    }
                }

                if (cancelled) return;
                setLoading(false);
            } catch (err) {
                console.error('Dashboard init error:', err);
                if (!cancelled) setLoading(false);
            }
        }

        init();
        return () => { cancelled = true; };
    }, [navigate]);

    // Start payment polling if locked
    useEffect(() => {
        if (isLocked && currentUser && !loading) {
            startPaymentPolling();
        }
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [isLocked, currentUser, loading, startPaymentPolling]);

    const value = {
        currentUser, setCurrentUser,
        currentProfile, setCurrentProfile,
        currentTeam, setCurrentTeam,
        currentProjects, setCurrentProjects,
        isLocked, setIsLocked,
        isAdmin, setIsAdmin,
        loading,
        signOut,
        getProxiedUrl,
        formatDate, formatDateTime,
        calculateLevel,
        profileSlug,
        supabase
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}
