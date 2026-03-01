/**
 * Engagement Features: Streak, Leaderboard, Resources
 */

// Progressive Level Calculation
// Level 1→2: 100 XP, Level 2→3: 200 XP, Level 3→4: 300 XP, etc.
// Total XP for level N: sum(1 to N-1) * 100 = (N-1)*N/2 * 100
function calculateLevel(xp) {
    if (!xp || xp <= 0) return 1;
    // Solve: (L-1)*L/2 * 100 <= xp
    // L^2 - L - 2*xp/100 <= 0
    // L = (1 + sqrt(1 + 8*xp/100)) / 2
    const level = Math.floor((1 + Math.sqrt(1 + 8 * xp / 100)) / 2);
    return Math.max(1, level);
}

// Calculate XP needed for next level
function xpForNextLevel(currentLevel) {
    return currentLevel * 100; // Level 1→2 needs 100, 2→3 needs 200, etc.
}

// Calculate total XP needed to reach a level
function totalXpForLevel(level) {
    if (level <= 1) return 0;
    return ((level - 1) * level / 2) * 100;
}

// Award XP to user and show toast
async function awardXP(userId, amount, reason) {
    if (!userId || !amount) return false;

    try {
        // Get current XP
        const { data: profile, error: fetchError } = await supabaseClient
            .from('profiles')
            .select('xp')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        const currentXP = profile?.xp || 0;
        const newXP = currentXP + amount;
        const oldLevel = calculateLevel(currentXP);
        const newLevel = calculateLevel(newXP);

        // Update XP
        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ xp: newXP })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Show toast
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#f8fafc'
        });

        if (newLevel > oldLevel) {
            // Level up!
            Toast.fire({
                icon: 'success',
                title: `🎉 Level Up! You're now Level ${newLevel}!`,
                text: `+${amount} XP (${reason})`
            });
        } else {
            Toast.fire({
                icon: 'success',
                title: `+${amount} XP`,
                text: reason
            });
        }

        // Update local profile if available
        if (typeof currentProfile !== 'undefined' && currentProfile) {
            currentProfile.xp = newXP;
        }

        return true;
    } catch (error) {
        console.error('Error awarding XP:', error);
        return false;
    }
}

// Make globally available
window.calculateLevel = calculateLevel;
window.awardXP = awardXP;

// Daily Streak Logic
async function listEngagementFeatures() {

    checkStreak();
    loadLeaderboard();
    loadResources();
    loadRewards();
    loadReferralCard(); // New
    showStreakReminder(); // Show reminder for new/returning users
}

async function checkStreak() {
    if (!currentUser || !currentProfile) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const lastCheckIn = currentProfile.last_check_in ? new Date(currentProfile.last_check_in).toISOString().split('T')[0] : null;

    if (today === lastCheckIn) {
        // Already checked in today
        updateStreakUI(currentProfile.current_streak || 0, true);
        return;
    }

    // Calculate streak
    let newStreak = 1;
    let isStreakContinues = false;
    let streakBroken = false;

    if (lastCheckIn) {
        const lastDate = new Date(lastCheckIn);
        const todayDate = new Date(today);
        const diffTime = todayDate - lastDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Checked in yesterday - continue streak
            newStreak = (currentProfile.current_streak || 0) + 1;
            isStreakContinues = true;
        } else if (diffDays > 1) {
            // Streak broken - missed days
            streakBroken = true;
            newStreak = 1;
        }
    }

    // Calculate XP bonus based on streak
    let xpBonus = 10; // Base daily login XP
    if (newStreak >= 7) xpBonus = 25; // Week streak bonus
    else if (newStreak >= 3) xpBonus = 15; // 3-day streak bonus

    // Update DB
    const { error } = await supabaseClient
        .from('profiles')
        .update({
            last_check_in: new Date().toISOString(),
            current_streak: newStreak,
            longest_streak: Math.max(currentProfile.longest_streak || 0, newStreak),
            xp: (currentProfile.xp || 0) + xpBonus
        })
        .eq('id', currentUser.id);

    if (!error) {
        // Trigger Referral Reward (if applicable)
        // Fire and forget - if this is their first check-in, referrer gets rewarded
        supabaseClient.rpc('complete_referral_reward', { user_id_input: currentUser.id });

        // Update local profile
        const oldStreak = currentProfile.current_streak || 0;
        currentProfile.current_streak = newStreak;
        currentProfile.longest_streak = Math.max(currentProfile.longest_streak || 0, newStreak);
        currentProfile.last_check_in = new Date().toISOString();
        currentProfile.xp = (currentProfile.xp || 0) + xpBonus;

        if (streakBroken && oldStreak > 1) {
            showStreakBrokenToast(oldStreak);
        } else if (isStreakContinues) {
            showStreakToast(newStreak, xpBonus);
        } else if (newStreak === 1) {
            showFirstCheckInToast();
        }

        updateStreakUI(newStreak, true);

        // Refresh XP display if needed
        if (document.getElementById('userXP')) {
            document.getElementById('userXP').textContent = currentProfile.xp;
        }
    }
}

function updateStreakUI(streakCount, isCheckedIn) {
    const streakEl = document.getElementById('streakCounter');
    if (streakEl) {
        const streakText = streakCount === 1 ? '1 Day' : `${streakCount} Days`;
        const fireColor = streakCount >= 7 ? '#ef4444' : streakCount >= 3 ? '#f97316' : '#fbbf24';

        streakEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-fire ${isCheckedIn ? 'streak-active' : ''}" style="color: ${fireColor}; font-size: 1.2rem;"></i>
                <div style="line-height: 1.2;">
                    <div style="font-weight: 600; font-size: 0.9rem;">${streakText}</div>
                    <div style="font-size: 0.7rem; color: ${isCheckedIn ? '#10b981' : 'var(--text-muted)'};">
                        ${isCheckedIn ? '✓ Checked in' : 'Tap to check in!'}
                    </div>
                </div>
            </div>
        `;

        // Style the container
        streakEl.style.padding = '8px 14px';
        streakEl.style.borderRadius = '12px';
        streakEl.style.cursor = isCheckedIn ? 'default' : 'pointer';
        streakEl.title = isCheckedIn
            ? `${streakCount} day streak! Come back tomorrow to keep it going.`
            : 'Click to check in and start/continue your streak!';

        // Add click event for manual check-in
        streakEl.onclick = async () => {
            if (!isCheckedIn && currentUser && currentProfile) {
                streakEl.style.transform = 'scale(1.1)';
                streakEl.style.transition = 'transform 0.2s';
                await checkStreak();
                setTimeout(() => { streakEl.style.transform = 'scale(1)'; }, 200);
            } else if (isCheckedIn) {
                showStreakInfoModal();
            }
        };
    }
}

function showStreakToast(days, xpEarned) {
    const milestone = days === 7 || days === 14 || days === 30 || days === 100;

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: milestone ? 5000 : 3000,
        timerProgressBar: true
    });

    if (milestone) {
        Toast.fire({
            icon: 'success',
            title: `🎉 ${days} Day Milestone!`,
            html: `<div>Incredible commitment! +${xpEarned} XP earned.</div>
                   <div style="font-size: 0.85rem; margin-top: 4px; color: #10b981;">Keep the streak alive!</div>`
        });
    } else {
        Toast.fire({
            icon: 'success',
            title: `🔥 ${days} Day Streak!`,
            text: `Keep it up! +${xpEarned} XP earned.`
        });
    }
}

function showStreakBrokenToast(oldStreak) {
    Swal.fire({
        icon: 'info',
        title: 'Streak Reset',
        html: `<div style="text-align: center;">
            <p>Your <strong>${oldStreak} day streak</strong> has ended.</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Don't worry! A new streak starts today. 🔥</p>
            <p style="color: #10b981; font-size: 0.85rem; margin-top: 8px;">+10 XP for checking in today!</p>
        </div>`,
        confirmButtonText: 'Start Fresh!',
        confirmButtonColor: '#10b981',
        timer: 8000,
        timerProgressBar: true
    });
}

function showFirstCheckInToast() {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true
    });

    Toast.fire({
        icon: 'success',
        title: '🔥 Streak Started!',
        html: `<div>Day 1 of your streak! +10 XP</div>
               <div style="font-size: 0.8rem; color: var(--text-secondary);">Come back tomorrow to keep it going!</div>`
    });
}

function showStreakReminder() {
    // Show only for users who haven't checked in today
    if (!currentUser || !currentProfile) return;

    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = currentProfile.last_check_in
        ? new Date(currentProfile.last_check_in).toISOString().split('T')[0]
        : null;

    // Don't show if already checked in today
    if (today === lastCheckIn) return;

    // Check if this is a new user (never checked in)
    const isNewUser = !lastCheckIn;

    // Show reminder after 2 seconds
    setTimeout(() => {
        if (isNewUser) {
            // Welcome message for new users
            Swal.fire({
                title: '🔥 Daily Streak System',
                html: `
                    <div style="text-align: left; padding: 10px;">
                        <p style="margin-bottom: 12px;">Welcome! Build your streak by checking in daily:</p>
                        <div style="background: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <i class="fas fa-fire" style="color: #f59e0b; font-size: 1.5rem;"></i>
                                <div>
                                    <strong>Daily Login = XP</strong>
                                    <div style="font-size: 0.85rem; color: var(--text-secondary);">+10 XP per day, +15 XP for 3+ days, +25 XP for 7+ days</div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <i class="fas fa-trophy" style="color: #10b981; font-size: 1.5rem;"></i>
                                <div>
                                    <strong>Climb the Leaderboard</strong>
                                    <div style="font-size: 0.85rem; color: var(--text-secondary);">Higher XP = Better rank among interns</div>
                                </div>
                            </div>
                        </div>
                        <p style="font-size: 0.9rem; color: var(--text-secondary);">Look for the 🔥 icon in the header to check in!</p>
                    </div>
                `,
                confirmButtonText: 'Start My Streak!',
                confirmButtonColor: '#f59e0b',
                showCancelButton: false
            }).then((result) => {
                if (result.isConfirmed) {
                    checkStreak();
                }
            });
        } else {
            // Returning user - gentle reminder
            const currentStreak = currentProfile.current_streak || 0;
            const lastDate = new Date(lastCheckIn);
            const today = new Date();
            const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1 && currentStreak > 0) {
                // Can continue streak
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: true,
                    confirmButtonText: 'Check In',
                    timer: 8000,
                    timerProgressBar: true
                });

                Toast.fire({
                    icon: 'info',
                    title: `🔥 Continue your ${currentStreak} day streak?`,
                    text: 'Check in now before it resets!'
                }).then((result) => {
                    if (result.isConfirmed) {
                        checkStreak();
                    }
                });
            }
        }
    }, 2000);
}

function showStreakInfoModal() {
    const streak = currentProfile.current_streak || 0;
    const longestStreak = currentProfile.longest_streak || streak;
    const xp = currentProfile.xp || 0;

    Swal.fire({
        title: '🔥 Your Streak Stats',
        html: `
            <div style="text-align: center; padding: 10px;">
                <div style="display: flex; justify-content: center; gap: 24px; margin-bottom: 20px;">
                    <div style="background: rgba(245, 158, 11, 0.1); padding: 16px 24px; border-radius: 12px;">
                        <div style="font-size: 2rem; font-weight: 700; color: #f59e0b;">${streak}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Current Streak</div>
                    </div>
                    <div style="background: rgba(16, 185, 129, 0.1); padding: 16px 24px; border-radius: 12px;">
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981;">${longestStreak}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Longest Streak</div>
                    </div>
                </div>
                <div style="background: rgba(99, 102, 241, 0.1); padding: 12px 20px; border-radius: 8px; display: inline-block;">
                    <span style="font-size: 1.25rem; font-weight: 600; color: #6366f1;">${xp} XP</span>
                    <span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 8px;">Total Earned</span>
                </div>
                <p style="margin-top: 16px; font-size: 0.9rem; color: var(--text-secondary);">
                    Come back tomorrow to continue your streak!
                </p>
            </div>
        `,
        confirmButtonText: 'Got it!',
        confirmButtonColor: '#10b981'
    });
}

// Streak Help Modal - explains how the system works
function showStreakHelpModal() {
    Swal.fire({
        title: '⚡ XP & Level System',
        html: `
            <div style="text-align: left; max-width: 420px; margin: 0 auto;">
                <!-- Streak XP -->
                <div style="margin-bottom: 16px;">
                    <h4 style="color: #f59e0b; margin-bottom: 8px; font-size: 0.95rem;">
                        <i class="fas fa-fire" style="margin-right: 6px;"></i>Daily Streak XP
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(99, 102, 241, 0.1); padding: 8px 12px; border-radius: 6px;">
                            <span style="color: #1e293b; font-size: 0.85rem;">Daily check-in</span>
                            <span style="color: #6366f1; font-weight: 600;">+10 XP</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(249, 115, 22, 0.1); padding: 8px 12px; border-radius: 6px;">
                            <span style="color: #1e293b; font-size: 0.85rem;">3+ Day Streak</span>
                            <span style="color: #f97316; font-weight: 600;">+15 XP</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(239, 68, 68, 0.1); padding: 8px 12px; border-radius: 6px;">
                            <span style="color: #1e293b; font-size: 0.85rem;">7+ Day Streak</span>
                            <span style="color: #ef4444; font-weight: 600;">+25 XP</span>
                        </div>
                    </div>
                </div>

                <!-- Project XP -->
                <div style="margin-bottom: 16px;">
                    <h4 style="color: #3b82f6; margin-bottom: 8px; font-size: 0.95rem;">
                        <i class="fas fa-project-diagram" style="margin-right: 6px;"></i>Project XP
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(59, 130, 246, 0.1); padding: 8px 12px; border-radius: 6px;">
                            <span style="color: #1e293b; font-size: 0.85rem;">Submit a project</span>
                            <span style="color: #3b82f6; font-weight: 600;">+50 XP</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(16, 185, 129, 0.1); padding: 8px 12px; border-radius: 6px;">
                            <span style="color: #1e293b; font-size: 0.85rem;">Project approved</span>
                            <span style="color: #10b981; font-weight: 600;">+100 XP</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(168, 85, 247, 0.1); padding: 8px 12px; border-radius: 6px;">
                            <span style="color: #1e293b; font-size: 0.85rem;">Successful referral</span>
                            <span style="color: #a855f7; font-weight: 600;">+30 XP</span>
                        </div>
                    </div>
                </div>

                <!-- Level System -->
                <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1)); padding: 12px; border-radius: 8px; border: 1px solid rgba(99, 102, 241, 0.2);">
                    <h4 style="color: #1e293b; margin-bottom: 6px; font-size: 0.9rem;">
                        <i class="fas fa-chart-line" style="color: #6366f1; margin-right: 6px;"></i>Progressive Levels
                    </h4>
                    <p style="color: #475569; font-size: 0.8rem; margin-bottom: 8px; line-height: 1.4;">
                        Each level requires more XP than the last:
                    </p>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <span style="background: #1e293b; color: #f8fafc; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Lvl 2: 100 XP</span>
                        <span style="background: #1e293b; color: #f8fafc; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Lvl 3: 300 XP</span>
                        <span style="background: #1e293b; color: #f8fafc; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Lvl 4: 600 XP</span>
                        <span style="background: #1e293b; color: #f8fafc; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Lvl 5: 1000 XP</span>
                    </div>
                </div>
            </div>
        `,
        confirmButtonText: 'Got It!',
        confirmButtonColor: '#6366f1',
        width: 480
    });
}

// Make it globally available
window.showStreakHelpModal = showStreakHelpModal;

// Leaderboard Logic (Batch-wise, Top 4)
async function loadLeaderboard() {
    const container = document.getElementById('leaderboardList');
    if (!container) return;

    if (typeof SkeletonUI !== 'undefined') {
        container.innerHTML = SkeletonUI.generateTableRows(3, 4); // Mock rows
    } else {
        container.innerHTML = '<div class="glass-card" style="text-align: center;">Loading Top Interns...</div>';
    }

    try {
        // Get current user's batch_id from the global currentTeam
        const batchId = (typeof currentTeam !== 'undefined' && currentTeam) ? currentTeam.batch_id : null;
        let topUsers = [];

        if (batchId) {
            // 1. Get all teams in the same batch
            const { data: batchTeams, error: teamsErr } = await supabaseClient
                .from('teams')
                .select('id')
                .eq('batch_id', batchId);

            if (!teamsErr && batchTeams && batchTeams.length > 0) {
                const teamIds = batchTeams.map(t => t.id);

                // 2. Get all user_ids from those teams
                const { data: members, error: membersErr } = await supabaseClient
                    .from('team_members')
                    .select('user_id')
                    .in('team_id', teamIds);

                if (!membersErr && members && members.length > 0) {
                    const userIds = [...new Set(members.map(m => m.user_id))];

                    // 3. Fetch profiles for those users, ordered by XP
                    const { data, error } = await supabaseClient
                        .from('profiles')
                        .select('full_name, xp, level, avatar_url')
                        .in('id', userIds)
                        .not('full_name', 'ilike', '%Test%')
                        .neq('full_name', 'GKK Admin')
                        .order('xp', { ascending: false })
                        .limit(4);

                    if (!error && data) topUsers = data;
                }
            }
        }

        // Fallback: if no batch or no results, show global top 4
        if (topUsers.length === 0) {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('full_name, xp, level, avatar_url')
                .not('full_name', 'ilike', '%Test%')
                .neq('full_name', 'GKK Admin')
                .order('xp', { ascending: false })
                .limit(4);

            if (!error && data) topUsers = data;
        }

        if (!topUsers || topUsers.length === 0) {
            container.innerHTML = '<div class="error-state">No interns found in your batch</div>';
            return;
        }

        let html = `
            <div class="leaderboard-header">
                <span>Rank</span>
                <span>Intern</span>
                <span>XP</span>
            </div>
            <div class="leaderboard-body">
        `;

        topUsers.forEach((user, index) => {
            const rank = index + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'rank-1';
            if (rank === 2) rankClass = 'rank-2';
            if (rank === 3) rankClass = 'rank-3';

            const name = user.full_name || 'Anonymous User';
            const xp = user.xp || 0;
            const level = calculateLevel(xp); // Progressive level formula

            html += `
                <div class="leaderboard-row ${rankClass}">
                    <div class="rank-badge">${rank}</div>
                    <div class="user-info">
                        <div class="user-avatar-sm">${name.charAt(0)}</div>
                        <div>
                            <div class="user-name">${name}</div>
                            <div class="user-level">Lvl ${level}</div>
                        </div>
                    </div>
                    <div class="user-xp">${xp} XP</div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        console.error('Error loading leaderboard:', err);
        container.innerHTML = '<div class="error-state">Could not load leaderboard</div>';
    }
}

// Resources Logic
async function loadResources() {
    const container = document.getElementById('resourcesGrid');
    if (!container) return;

    if (typeof SkeletonUI !== 'undefined') {
        container.innerHTML = SkeletonUI.generateCards(3);
    } else {
        container.innerHTML = '<div class="glass-card" style="grid-column: 1/-1;">Loading Resources...</div>';
    }

    const { data: resources, error } = await supabaseClient
        .from('resources')
        .select('*')
        .order('category');

    if (error) {
        console.error("Error loading resources:", error);
        container.innerHTML = '<div class="error-state">Failed to load resources.</div>';
        return;
    }

    if (!resources || resources.length === 0) {
        container.innerHTML = '<div class="empty-state">No resources available yet.</div>';
        return;
    }

    let html = '';

    // Group by category if desired, but grid is simpler for now
    resources.forEach(res => {
        html += `
            <a href="${res.url}" target="_blank" class="resource-card glass-card">
                <div class="res-icon">
                    <i class="${res.icon || 'fas fa-link'}"></i>
                </div>
                <div class="res-content">
                    <div class="res-category">${res.category}</div>
                    <h4 class="res-title">${res.title}</h4>
                    ${res.is_premium ? '<span class="badge-premium"><i class="fas fa-crown"></i> Premium</span>' : ''}
                </div>
                <div class="res-action">
                    <i class="fas fa-external-link-alt"></i>
                </div>
            </a>
        `;
    });

    container.innerHTML = html;
}

// Streak Alert (Landing Page)
async function loadStreakAlert() {
    const container = document.getElementById('streak-toast-container');
    if (!container) return;

    try {
        const { data: topUser, error } = await supabaseClient
            .rpc('get_top_streak_user');

        if (error) throw error;

        // Single object returned since we used LIMIT 1
        const user = topUser && topUser.length > 0 ? topUser[0] : null;

        // If no user found at all, don't show anything
        if (!user) return;

        const name = user.full_name || 'Anonymous';
        const streak = user.current_streak;
        const avatar = user.avatar_url ? getProxiedUrl(user.avatar_url) : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name);

        const messages = [];

        // 1. Specific User Streak (Only if significant)
        if (streak >= 3) {
            messages.push(`
            <div class="streak-toast" style="position: relative; padding-right: 2.5rem;" onclick="document.getElementById('leaderboard').scrollIntoView({behavior: 'smooth'})">
                <img src="${avatar}" alt="${name}" class="streak-avatar" loading="lazy">
                <div class="streak-content">
                    🔥 <span style="font-weight: 600;">${name}</span> is on a <span class="streak-highlight">${streak}-day streak!</span>
                </div>
                <button onclick="event.stopPropagation(); this.closest('#streak-toast-container').remove(); window.clearStreakInterval();" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            `);
        }

        // 2. Generic Message (Always active if there is at least one active intern)
        messages.push(`
            <div class="streak-toast" style="position: relative; padding-right: 2.5rem;" onclick="document.getElementById('leaderboard').scrollIntoView({behavior: 'smooth'})">
                <div style="width: 32px; height: 32px; background: rgba(59, 130, 246, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #3b82f6;">
                     <i class="fas fa-trophy" style="color: #3b82f6; font-size: 0.9rem;"></i>
                </div>
                <div class="streak-content">
                    🏆 Checkout the <span style="font-weight: 600; color: #3b82f6;">Top Interns</span> Streaks
                </div>
                <button onclick="event.stopPropagation(); this.closest('#streak-toast-container').remove(); window.clearStreakInterval();" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `);

        let index = 0;

        // Use a function to update content
        const updateContent = () => {
            const container = document.getElementById('streak-toast-container');
            if (container) {
                container.innerHTML = messages[index];
                index = (index + 1) % messages.length;
            }
        };

        // Initial Show (Immediate)
        updateContent();

        // Rotate every 3 seconds ONLY if we have more than 1 message
        if (messages.length > 1) {
            const intervalId = setInterval(updateContent, 3000);
            window.clearStreakInterval = () => clearInterval(intervalId);
        } else {
            // No interval needed, clear function does nothing
            window.clearStreakInterval = () => { };
        }

    } catch (err) {
        console.error('Error loading streak alert:', err);
    }
}

// Public Leaderboard (for Landing Page - no auth required)
async function loadPublicLeaderboard() {
    const container = document.getElementById('publicLeaderboardContainer');
    if (!container) return;

    try {
        // Fetch from public secure RPC
        const { data: topUsers, error } = await supabaseClient
            .rpc('get_public_leaderboard');

        if (error) throw error;

        if (!topUsers || topUsers.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <p>No active interns yet. Be the first!</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="leaderboard-header" style="background: var(--bg-card); border-radius: 12px 12px 0 0; border: 1px solid var(--border);">
                <span>Rank</span>
                <span>Intern</span>
                <span style="text-align: right;">XP / Streak</span>
            </div>
            <div class="leaderboard-body">
        `;

        topUsers.forEach((user, index) => {
            const rank = index + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'rank-1';
            if (rank === 2) rankClass = 'rank-2';
            if (rank === 3) rankClass = 'rank-3';

            const name = user.full_name || 'Anonymous';
            const xp = user.xp || 0;
            const streak = user.current_streak || 0;
            const level = Math.floor(xp / 100) + 1;

            html += `
                <div class="leaderboard-row ${rankClass}" style="background: var(--bg-card);">
                    <div class="rank-badge">${rank}</div>
                    <div class="user-info">
                        <div class="user-avatar-sm">${name.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="user-name">${name}</div>
                            <div class="user-level">Level ${level}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div class="user-xp">${xp} XP</div>
                        ${streak > 0 ? `<div style="font-size: 0.8rem; color: #f97316;"><i class="fas fa-fire"></i> ${streak} day${streak > 1 ? 's' : ''}</div>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

    } catch (err) {
        console.error('Error loading public leaderboard:', err);
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <p>Could not load leaderboard</p>
            </div>
        `;
    }
}

// Rewards Logic (for Dashboard)
async function loadRewards() {
    const container = document.getElementById('rewardsContainer');
    if (!container || !currentUser) return;

    // Use Skeleton Card
    if (typeof SkeletonUI !== 'undefined') {
        container.innerHTML = SkeletonUI.generateCards(2);
    } else {
        container.innerHTML = '<div class="glass-card">Loading your rewards...</div>';
    }

    try {
        // Fetch user's assigned rewards with reward details
        const { data: assignments, error } = await supabaseClient
            .from('reward_assignments')
            .select(`
                *,
                rewards:reward_id (*)
            `)
            .eq('user_id', currentUser.id)
            .order('assigned_at', { ascending: false });

        if (error) throw error;

        let html = '';

        if (assignments && assignments.length > 0) {
            // Has rewards
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h4 style="margin: 0;"><i class="fas fa-gift" style="color: #f59e0b; margin-right: 0.5rem;"></i>Your Rewards (${assignments.length})</h4>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            `;

            assignments.forEach(assignment => {
                const reward = assignment.rewards;
                if (!reward) return;

                const isRedeemed = assignment.redeemed;
                const hasImage = reward.image_url && reward.image_url.trim() !== '';
                const assignedDate = new Date(assignment.assigned_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

                html += `
                    <div class="glass-card reward-card" style="overflow: hidden; ${isRedeemed ? 'opacity: 0.7;' : ''}">
                        ${hasImage ? `
                            <div style="margin: -1.5rem -1.5rem 1rem -1.5rem;">
                                <img src="${getProxiedUrl(reward.image_url)}" alt="${reward.title}" loading="lazy" 
                                     style="width: 100%; height: 140px; object-fit: cover;"
                                     onerror="this.parentElement.innerHTML='<div style=\\'height: 140px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2)); display: flex; align-items: center; justify-content: center;\\' ><i class=\\'fas fa-gift\\' style=\\'font-size: 3rem; color: var(--accent-primary);\\' ></i></div>'">
                            </div>
                        ` : `
                            <div style="margin: -1.5rem -1.5rem 1rem -1.5rem; height: 140px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2)); display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-gift" style="font-size: 3rem; color: var(--accent-primary);"></i>
                            </div>
                        `}
                        
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                            <h5 style="margin: 0; font-size: 1.1rem;">${reward.title}</h5>
                            ${isRedeemed ? '<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem;">Used</span>' : ''}
                        </div>
                        
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.5;">
                            ${reward.description || 'No description provided.'}
                        </p>
                        
                        <!-- Coupon Code Box -->
                        <div style="background: var(--bg-elevated); border: 2px dashed var(--accent-primary); border-radius: 12px; padding: 1rem; text-align: center; margin-bottom: 1rem;">
                            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Coupon Code</div>
                            <div style="font-family: 'JetBrains Mono', monospace; font-size: 1.3rem; font-weight: 700; color: var(--accent-primary); letter-spacing: 2px;">
                                ${reward.coupon_code}
                            </div>
                            <button onclick="copyRewardCode('${reward.coupon_code}', this)" class="btn btn-secondary" style="margin-top: 0.75rem; font-size: 0.85rem; padding: 0.5rem 1rem;">
                                <i class="fas fa-copy"></i> Copy Code
                            </button>
                        </div>
                        
                        ${assignment.message ? `
                            <div style="background: rgba(16, 185, 129, 0.1); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
                                <i class="fas fa-comment" style="color: var(--accent-primary); margin-right: 0.5rem;"></i>${assignment.message}
                            </div>
                        ` : ''}
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--border);">
                            ${reward.expiry_text ? `
                                <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fas fa-clock" style="margin-right: 0.5rem;"></i>${reward.expiry_text}</span>
                            ` : '<span></span>'}
                            ${reward.value ? `<span style="font-weight: 600; color: #10b981;">₹${reward.value}</span>` : ''}
                        </div>
                        
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.75rem;">
                            <i class="fas fa-calendar-alt" style="margin-right: 0.5rem;"></i>Received on ${assignedDate}
                        </div>
                        
                        ${!isRedeemed ? `
                            <button onclick="markRewardUsed('${assignment.id}', this)" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                                <i class="fas fa-check-circle"></i> Mark as Used
                            </button>
                        ` : ''}
                    </div>
                `;
            });

            html += '</div>';
        } else {
            // No rewards yet
            html = `
                <div class="glass-card" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-gift" style="font-size: 3rem; color: var(--border); margin-bottom: 1.5rem;"></i>
                    <h4 style="margin-bottom: 0.5rem;">No Rewards Yet</h4>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; max-width: 400px; margin: 0 auto;">
                        Keep up the excellent work! Rewards will appear here when your mentors assign them to you.
                    </p>
                </div>
            `;
        }

        container.innerHTML = html;

    } catch (err) {
        console.error('Error loading rewards:', err);
        container.innerHTML = '<div class="glass-card error-state" style="text-align: center; padding: 2rem;"><i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #f87171; margin-bottom: 1rem;"></i><p>Could not load rewards. Please try again later.</p></div>';
    }
}

// Copy reward code to clipboard
window.copyRewardCode = async function (code, btn) {
    try {
        await navigator.clipboard.writeText(code);
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = 'var(--accent-primary)';
        btn.style.color = 'white';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.style.color = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
};


// Referral Logic
async function loadReferralCard() {

    try {
        const container = document.getElementById('referralCardContainer');
        if (!container) {
            console.error('Referral container not found!');
            return;
        }
        if (!currentProfile) {
            console.error('Current profile missing in loadReferralCard');
            // Show error in container
            container.innerHTML = `<div class="glass-card" style="color:red; text-align:center;">Profile Error</div>`;
            return;
        }



        // payment lock check
        const isLocked = currentProfile.status !== 'active';
        const referralCode = currentProfile.referral_code || 'Generating...';
        const referralCount = currentProfile.referral_count || 0;



        // Calculate total XP earned from referrals (assuming 100 XP per referral)
        // We might need to store this separately if we want exacts, but 100 * count is a good estimate
        // Or we can just show the count.

        if (isLocked) {
            container.innerHTML = `
            <div class="glass-card" style="position: relative; overflow: hidden; padding: 3rem; text-align: center; border: 1px solid var(--border);">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; backdrop-filter: blur(4px); background: rgba(15, 23, 42, 0.6); z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; margin-bottom: 1.5rem; box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h3 style="color: white; margin-bottom: 0.5rem;">Unlock Referrals</h3>
                    <p style="color: #cbd5e1; max-width: 400px; margin-bottom: 1.5rem;">Complete your registration to start inviting friends and earning rewards.</p>
                    <button onclick="navigateTo('payment')" class="btn btn-primary" style="background: #f59e0b; border: none;">
                        Complete Registration
                    </button>
                </div>
                <!-- Blurred Background Content -->
                <div style="filter: blur(8px); opacity: 0.5;">
                    <h2>Invite Friends & Earn</h2>
                    <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                         <div style="height: 100px; width: 200px; background: var(--bg-card); border-radius: 12px;"></div>
                    </div>
                </div>
            </div>
        `;

        } else {
            // Normal Referral Card with Redeem Option
            container.innerHTML = `
             <div class="glass-card" style="padding: 0; overflow: hidden;">
                 <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 3rem 2rem; color: white; text-align: center;">
                     <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.9;"></i>
                     <h2 style="margin-bottom: 0.5rem;">Community Builder</h2>
                     <p style="opacity: 0.9; max-width: 500px; margin: 0 auto; margin-bottom: 1.5rem;">
                         Share your unique code with friends. They get <span style="font-weight: 700;">+50 XP</span> head start, and you get <span style="font-weight: 700;">+100 XP</span> when they become active!
                     </p>
                     
                     <!-- Redeem Button -->
                     <button onclick="redeemReferralCode()" class="btn" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white; backdrop-filter: blur(4px); font-size: 0.9rem;">
                         <i class="fas fa-gift" style="margin-right: 8px;"></i>Have a code? Redeem it!
                     </button>
                 </div>
                 
                 <div style="padding: 2rem;">
                     <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                         
                         <!-- Your Code -->
                         <div>
                             <h4 style="margin-bottom: 1rem; color: var(--text-secondary);">Your Unique Code</h4>
                             <div style="background: var(--bg-elevated); border: 2px dashed var(--accent-primary); border-radius: 16px; padding: 1.5rem; text-align: center; position: relative;">
                                 <div style="font-family: 'JetBrains Mono', monospace; font-size: 2rem; font-weight: 700; color: var(--accent-primary); letter-spacing: 2px; margin-bottom: 1rem;">
                                     ${referralCode}
                                 </div>
                                 <div style="display: flex; gap: 1rem; justify-content: center;">
                                     <button onclick="copyRewardCode('${referralCode}', this)" class="btn btn-secondary">
                                         <i class="fas fa-copy"></i> Copy Code
                                     </button>
                                 </div>
                             </div>
                         </div>
 
                         <!-- Stats -->
                         <div>
                             <h4 style="margin-bottom: 1rem; color: var(--text-secondary);">Your Impact</h4>
                             <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                 <div style="background: rgba(16, 185, 129, 0.1); padding: 1.5rem; border-radius: 16px; text-align: center;">
                                     <div style="font-size: 2.5rem; font-weight: 700; color: #10b981;">${referralCount}</div>
                                     <div style="font-size: 0.9rem; color: var(--text-secondary);">Friends Invited</div>
                                 </div>
                                 <div style="background: rgba(99, 102, 241, 0.1); padding: 1.5rem; border-radius: 16px; text-align: center;">
                                     <div style="font-size: 2.5rem; font-weight: 700; color: #6366f1;">${referralCount * 100}</div>
                                     <div style="font-size: 0.9rem; color: var(--text-secondary);">XP Earned</div>
                                 </div>
                             </div>
                             
                             <!-- Badge Progress -->
                             <div style="margin-top: 1.5rem; background: var(--bg-elevated); padding: 1rem; border-radius: 12px;">
                                 <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;">
                                     <span>Next Badge: <strong>Community Builder</strong></span>
                                     <span>${referralCount}/10</span>
                                 </div>
                                 <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                                     <div style="height: 100%; width: ${Math.min((referralCount / 10) * 100, 100)}%; background: linear-gradient(90deg, #6366f1, #8b5cf6);"></div>
                                 </div>
                             </div>
                         </div>
                         
                     </div>
                 </div>
             </div>
         `;
        }
    } catch (error) {
        console.error('Error loading referral card:', error);
        const container = document.getElementById('referralCardContainer');
        if (container) {
            container.innerHTML = `<div class="glass-card" style="color:#ef4444; text-align:center; padding: 2rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>
                Unable to load referral code.<br>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${error.message}</span>
            </div>`;
        }
    }
}

function shareOnWhatsapp(code) {
    const text = `Hey! Join me on GKK Interns to kickstart your tech career. Use my code *${code}* to get a +50 XP head start! 🚀\n\nApply here: https://gkkintern.site/apply`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

async function redeemReferralCode() {
    const { value: code } = await Swal.fire({
        title: 'Redeem Referral Code',
        input: 'text',
        inputLabel: 'Enter the code shared by your friend',
        inputPlaceholder: 'e.g. ALEX123',
        showCancelButton: true,
        confirmButtonText: 'Redeem',
        confirmButtonColor: '#6366f1',
        showLoaderOnConfirm: true,
        preConfirm: async (code) => {
            if (!code) {
                Swal.showValidationMessage('Please enter a code');
                return false;
            }
            return code.toUpperCase().trim();
        },
        allowOutsideClick: () => !Swal.isLoading()
    });

    if (code) {
        try {
            // Call the database function directly
            const { error } = await supabaseClient.rpc('claim_referral', { code_used: code });

            if (error) throw error;

            // Success!
            Swal.fire({
                icon: 'success',
                title: 'Code Redeemed!',
                html: 'You earned <b>+50 XP</b>!<br>Welcome to the community.',
                confirmButtonColor: '#10b981'
            }).then(() => {
                // Refresh profile to show new XP
                location.reload();
            });

        } catch (err) {
            console.error('Redeem error:', err);
            // Handle specific errors potentially returned by Postgres, 
            // but usually it's just "void" or an error throw.
            // The function checks for self-referral etc but might not throw strict error codes for all logic failures,
            // inspecting the function logic: it does nothing if conditions aren't met.
            // Ideally the RPC should return a status. 
            // For now, if no error, we assume success, but if user wasn't updated (e.g. already referred), they might see success but no XP change.
            // Let's rely on the user noticing the XP change, or the logic in SQL.

            Swal.fire({
                icon: 'error',
                title: 'Redemption Failed',
                text: 'Invalid code, or you have already been referred.',
                confirmButtonColor: '#ef4444'
            });
        }
    }
}

// Make globally available
window.loadReferralCard = loadReferralCard;
window.shareOnWhatsapp = shareOnWhatsapp;

// Make functions global
window.listEngagementFeatures = listEngagementFeatures;
window.loadPublicLeaderboard = loadPublicLeaderboard;
window.loadRewards = loadRewards;
window.loadStreakAlert = loadStreakAlert;
