import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const DashboardContext = createContext(null);

export function useDashboard() {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
    return ctx;
}

export function DashboardProvider({ children }) {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [currentProfile, setCurrentProfile] = useState(null);
    const [currentTeam, setCurrentTeam] = useState(null);
    const [currentProjects, setCurrentProjects] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
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

    // XP/Level helpers
    const calculateLevel = useCallback((xp) => {
        if (!xp || xp <= 0) return 1;
        return Math.max(1, Math.floor((1 + Math.sqrt(1 + 8 * xp / 100)) / 2));
    }, []);

    const xpForNextLevel = useCallback((currentLevel) => currentLevel * 100, []);
    const totalXpForLevel = useCallback((level) => level <= 1 ? 0 : ((level - 1) * level / 2) * 100, []);

    // Award XP
    const awardXP = useCallback(async (userId, amount, reason) => {
        if (!userId || !amount) return false;
        try {
            const { data: profile, error: fetchError } = await supabase
                .from('profiles').select('xp').eq('id', userId).single();
            if (fetchError) throw fetchError;

            const currentXP = profile?.xp || 0;
            const newXP = currentXP + amount;

            const { error: updateError } = await supabase
                .from('profiles').update({ xp: newXP }).eq('id', userId);
            if (updateError) throw updateError;

            setCurrentProfile(prev => prev ? { ...prev, xp: newXP } : prev);

            const Swal = (await import('sweetalert2')).default;
            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false,
                timer: 4000, timerProgressBar: true,
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#f8fafc'
            });

            const oldLevel = calculateLevel(currentXP);
            const newLevel = calculateLevel(newXP);
            if (newLevel > oldLevel) {
                Toast.fire({ icon: 'success', title: `🎉 Level Up! You're now Level ${newLevel}!`, text: `+${amount} XP (${reason})` });
            } else {
                Toast.fire({ icon: 'success', title: `+${amount} XP`, text: reason });
            }
            return true;
        } catch (error) {
            console.error('Error awarding XP:', error);
            return false;
        }
    }, [calculateLevel]);

    // Sign out
    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (e) { /* ignore */ }
        navigate('/user/login');
    }, [navigate]);

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

                setCurrentProfile(profile);
                const locked = profile.status !== 'active';
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
        calculateLevel, xpForNextLevel, totalXpForLevel,
        awardXP,
        supabase
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}
