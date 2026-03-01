/**
 * Skeleton Loader Helpers
 * Generates section-specific skeleton HTML for premium loading states.
 * All skeletons use the .skeleton-pulse class (defined in skeleton.css).
 */

const SkeletonUI = {

    // ─── Overview Section ───
    generateOverviewStats: () => {
        const colors = [
            { bg: 'rgba(59,130,246,0.15)', shadow: 'rgba(59,130,246,0.2)' },
            { bg: 'rgba(16,185,129,0.15)', shadow: 'rgba(16,185,129,0.2)' },
            { bg: 'rgba(139,92,246,0.15)', shadow: 'rgba(139,92,246,0.2)' }
        ];
        return `<div class="stats-grid">${colors.map(c => `
            <div class="stat-card" style="border-color: ${c.shadow};">
                <div class="skeleton-pulse" style="width:60px;height:60px;border-radius:16px;flex-shrink:0;background:${c.bg};"></div>
                <div style="flex:1;">
                    <div class="skeleton-pulse" style="width:60px;height:28px;margin-bottom:8px;"></div>
                    <div class="skeleton-pulse" style="width:100px;height:14px;margin-bottom:6px;"></div>
                    <div class="skeleton-pulse" style="width:80px;height:12px;"></div>
                </div>
            </div>
        `).join('')}</div>`;
    },

    generateWelcomeCard: () => `
        <div class="glass-card card-tint-blue" style="border:1px dashed rgba(59,130,246,0.3);border-radius:16px;min-height:200px;display:flex;align-items:center;justify-content:center;text-align:center;">
            <div style="width:100%;max-width:400px;">
                <div class="skeleton-pulse" style="width:220px;height:24px;margin:0 auto 12px;"></div>
                <div class="skeleton-pulse" style="width:280px;height:14px;margin:0 auto 8px;"></div>
                <div class="skeleton-pulse" style="width:200px;height:14px;margin:0 auto 20px;"></div>
                <div class="skeleton-pulse" style="width:140px;height:38px;border-radius:8px;margin:0 auto;"></div>
            </div>
        </div>
    `,

    // ─── Profile Section ───
    generateProfile: () => `
        <div style="background:linear-gradient(135deg,rgba(16,185,129,0.3),rgba(5,150,105,0.3));padding:3rem 2rem;border-radius:12px;margin-bottom:2rem;display:flex;flex-direction:column;align-items:center;">
            <div class="skeleton-pulse skeleton-circle" style="width:120px;height:120px;margin-bottom:1rem;"></div>
            <div class="skeleton-pulse" style="width:180px;height:24px;margin-bottom:8px;"></div>
            <div class="skeleton-pulse" style="width:120px;height:16px;margin-bottom:12px;"></div>
            <div class="skeleton-pulse skeleton-pill" style="width:100px;height:28px;"></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-bottom:1.5rem;">
            ${Array(4).fill(0).map(() => `
                <div class="glass-card" style="text-align:center;padding:1.25rem;">
                    <div class="skeleton-pulse" style="width:50px;height:32px;margin:0 auto 8px;"></div>
                    <div class="skeleton-pulse" style="width:70px;height:12px;margin:0 auto;"></div>
                </div>
            `).join('')}
        </div>
        <div class="glass-card" style="margin-bottom:1.5rem;">
            <div class="skeleton-pulse" style="width:200px;height:22px;margin-bottom:1.25rem;"></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.25rem;">
                ${Array(5).fill(0).map((_, i) => `
                    <div>
                        <div class="skeleton-pulse" style="width:${80 + (i * 10) % 40}px;height:12px;margin-bottom:8px;"></div>
                        <div class="skeleton-pulse" style="width:100%;height:40px;border-radius:8px;"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `,

    // ─── Projects Section ───
    generateProjectCards: (count = 3) => {
        return Array(count).fill(0).map(() => `
            <div class="glass-card project-card" style="min-height:220px;">
                <div style="position:absolute;top:1.25rem;right:1.25rem;">
                    <div class="skeleton-pulse skeleton-pill" style="width:80px;height:24px;"></div>
                </div>
                <div class="skeleton-pulse" style="width:65%;height:22px;margin-bottom:10px;"></div>
                <div class="skeleton-pulse" style="width:95%;height:14px;margin-bottom:6px;"></div>
                <div class="skeleton-pulse" style="width:75%;height:14px;margin-bottom:1.5rem;"></div>
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:1rem;">
                    <div class="skeleton-pulse" style="width:14px;height:14px;border-radius:3px;"></div>
                    <div class="skeleton-pulse" style="width:120px;height:14px;"></div>
                </div>
                <div style="margin-top:auto;">
                    <div class="skeleton-pulse" style="width:130px;height:38px;border-radius:8px;"></div>
                </div>
            </div>
        `).join('');
    },

    // ─── Team Section ───
    generateTeamLayout: () => `
        <div class="team-section-layout">
            <div class="team-members-panel">
                <div class="glass-card" style="margin-bottom:1.5rem;padding:1.5rem;">
                    <div class="skeleton-pulse" style="width:160px;height:24px;margin-bottom:8px;"></div>
                    <div class="skeleton-pulse" style="width:200px;height:14px;"></div>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;">
                    ${Array(4).fill(0).map(() => `
                        <div class="glass-card" style="padding:1rem;display:flex;align-items:center;gap:1rem;">
                            <div class="skeleton-pulse skeleton-circle" style="width:44px;height:44px;flex-shrink:0;"></div>
                            <div style="flex:1;">
                                <div class="skeleton-pulse" style="width:${60 + Math.floor(Math.random() * 40)}%;height:16px;margin-bottom:6px;"></div>
                                <div class="skeleton-pulse" style="width:${40 + Math.floor(Math.random() * 20)}%;height:12px;"></div>
                            </div>
                            <div class="skeleton-pulse skeleton-pill" style="width:60px;height:22px;"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem;height:500px;display:flex;flex-direction:column;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <div class="skeleton-pulse skeleton-circle" style="width:36px;height:36px;"></div>
                    <div class="skeleton-pulse" style="width:120px;height:18px;"></div>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;gap:12px;">
                    ${Array(5).fill(0).map((_, i) => `
                        <div style="display:flex;${i % 2 === 0 ? '' : 'justify-content:flex-end;'}">
                            <div class="skeleton-pulse" style="width:${35 + Math.floor(Math.random() * 30)}%;height:36px;border-radius:12px;"></div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top:auto;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.05);">
                    <div class="skeleton-pulse" style="width:100%;height:44px;border-radius:10px;"></div>
                </div>
            </div>
        </div>
    `,

    // ─── Announcements Section ───
    generateAnnouncements: (count = 3) => {
        return Array(count).fill(0).map(() => `
            <div class="glass-card" style="padding:1.5rem;margin-bottom:1rem;border-left:3px solid rgba(99,102,241,0.3);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <div class="skeleton-pulse" style="width:55%;height:20px;"></div>
                    <div class="skeleton-pulse skeleton-pill" style="width:70px;height:22px;"></div>
                </div>
                <div class="skeleton-pulse" style="width:100%;height:14px;margin-bottom:8px;"></div>
                <div class="skeleton-pulse" style="width:85%;height:14px;margin-bottom:8px;"></div>
                <div class="skeleton-pulse" style="width:60%;height:14px;"></div>
            </div>
        `).join('');
    },

    // ─── Meetings Section ───
    generateMeetings: () => `
        <div class="glass-card" style="padding:2rem;margin-bottom:1.5rem;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:1.5rem;">
                <div class="skeleton-pulse skeleton-circle" style="width:12px;height:12px;"></div>
                <div class="skeleton-pulse" style="width:140px;height:20px;"></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr;gap:1.5rem;">
                <div class="glass-card" style="aspect-ratio:16/9;padding:0;overflow:hidden;display:flex;align-items:center;justify-content:center;">
                    <div class="skeleton-pulse" style="width:100%;height:100%;border-radius:0;"></div>
                </div>
                <div class="glass-card" style="height:350px;padding:1.5rem;display:flex;flex-direction:column;">
                    <div class="skeleton-pulse" style="width:100px;height:18px;margin-bottom:1rem;"></div>
                    <div style="flex:1;display:flex;flex-direction:column;gap:10px;">
                        ${Array(6).fill(0).map((_, i) => `
                            <div style="display:flex;${i % 2 === 0 ? '' : 'justify-content:flex-end;'}">
                                <div class="skeleton-pulse" style="width:${30 + Math.floor(Math.random() * 35)}%;height:32px;border-radius:10px;"></div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="skeleton-pulse" style="width:100%;height:42px;border-radius:10px;margin-top:auto;"></div>
                </div>
            </div>
        </div>
    `,

    // ─── Leaderboard Section ───
    generateLeaderboard: (count = 5) => `
        <div class="glass-card" style="padding:0;overflow:hidden;">
            <div style="padding:1.25rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between;">
                <div class="skeleton-pulse" style="width:50px;height:14px;"></div>
                <div class="skeleton-pulse" style="width:80px;height:14px;"></div>
                <div class="skeleton-pulse" style="width:40px;height:14px;"></div>
            </div>
            ${Array(count).fill(0).map((_, i) => {
        const highlight = i < 3 ? `border-left:3px solid ${['#fbbf24', '#94a3b8', '#cd7f32'][i]};` : '';
        return `
                    <div style="padding:1rem 1.5rem;display:flex;align-items:center;gap:1rem;border-bottom:1px solid rgba(255,255,255,0.03);${highlight}">
                        <div class="skeleton-pulse" style="width:32px;height:32px;border-radius:8px;flex-shrink:0;"></div>
                        <div class="skeleton-pulse skeleton-circle" style="width:40px;height:40px;flex-shrink:0;"></div>
                        <div style="flex:1;">
                            <div class="skeleton-pulse" style="width:${80 + Math.floor(Math.random() * 60)}px;height:16px;margin-bottom:4px;"></div>
                            <div class="skeleton-pulse" style="width:${50 + Math.floor(Math.random() * 30)}px;height:12px;"></div>
                        </div>
                        <div class="skeleton-pulse" style="width:60px;height:20px;border-radius:6px;"></div>
                    </div>
                `;
    }).join('')}
        </div>
    `,

    // ─── Resources Section ───
    generateResources: (count = 3) => {
        return Array(count).fill(0).map(() => `
            <div class="glass-card" style="padding:1.25rem;">
                <div style="display:flex;gap:1rem;align-items:flex-start;">
                    <div class="skeleton-pulse" style="width:44px;height:44px;border-radius:10px;flex-shrink:0;"></div>
                    <div style="flex:1;">
                        <div class="skeleton-pulse skeleton-pill" style="width:70px;height:18px;margin-bottom:8px;"></div>
                        <div class="skeleton-pulse" style="width:85%;height:18px;margin-bottom:6px;"></div>
                        <div class="skeleton-pulse" style="width:60%;height:14px;"></div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // ─── Rewards Section ───
    generateRewards: () => `
        <div class="glass-card" style="padding:2rem;text-align:center;margin-bottom:1.5rem;">
            <div class="skeleton-pulse skeleton-circle" style="width:70px;height:70px;margin:0 auto 1rem;"></div>
            <div class="skeleton-pulse" style="width:160px;height:22px;margin:0 auto 8px;"></div>
            <div class="skeleton-pulse" style="width:220px;height:14px;margin:0 auto 1.5rem;"></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
                ${Array(3).fill(0).map(() => `
                    <div class="glass-card" style="padding:1.25rem;">
                        <div class="skeleton-pulse" style="width:50px;height:50px;border-radius:12px;margin:0 auto 10px;"></div>
                        <div class="skeleton-pulse" style="width:100px;height:16px;margin:0 auto 6px;"></div>
                        <div class="skeleton-pulse" style="width:80px;height:14px;margin:0 auto 12px;"></div>
                        <div class="skeleton-pulse" style="width:120px;height:32px;border-radius:8px;margin:0 auto;"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `,

    // ─── Referrals Section ───
    generateReferrals: () => `
        <div class="glass-card" style="padding:2.5rem;text-align:center;">
            <div class="skeleton-pulse skeleton-circle" style="width:80px;height:80px;margin:0 auto 1.5rem;"></div>
            <div class="skeleton-pulse" style="width:200px;height:24px;margin:0 auto 10px;"></div>
            <div class="skeleton-pulse" style="width:280px;height:14px;margin:0 auto 8px;"></div>
            <div class="skeleton-pulse" style="width:240px;height:14px;margin:0 auto 2rem;"></div>
            <div style="display:flex;gap:1rem;justify-content:center;max-width:400px;margin:0 auto 1.5rem;">
                <div class="skeleton-pulse" style="flex:1;height:48px;border-radius:10px;"></div>
                <div class="skeleton-pulse" style="width:100px;height:48px;border-radius:10px;"></div>
            </div>
            <div style="display:flex;gap:0.75rem;justify-content:center;">
                <div class="skeleton-pulse skeleton-circle" style="width:44px;height:44px;"></div>
                <div class="skeleton-pulse skeleton-circle" style="width:44px;height:44px;"></div>
                <div class="skeleton-pulse skeleton-circle" style="width:44px;height:44px;"></div>
            </div>
        </div>
    `,

    // ─── Legacy Generators (kept for backward compat) ───
    generateTableRows: (cols, rows = 5) => {
        let html = '';
        for (let i = 0; i < rows; i++) {
            html += '<tr class="skeleton-table-row">';
            for (let j = 0; j < cols; j++) {
                const width = Math.floor(Math.random() * (90 - 40 + 1) + 40) + '%';
                html += `
                    <td>
                        <div class="skeleton skeleton-pulse" style="height: 16px; width: ${width};"></div>
                    </td>
                `;
            }
            html += '</tr>';
        }
        return html;
    },

    generateCards: (count = 3) => {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card">
                    <div style="display:flex; gap:16px; margin-bottom:16px;">
                        <div class="skeleton skeleton-pulse skeleton-avatar"></div>
                        <div style="flex:1;">
                            <div class="skeleton skeleton-pulse skeleton-text short"></div>
                            <div class="skeleton skeleton-pulse skeleton-text" style="width:30%;"></div>
                        </div>
                    </div>
                    <div class="skeleton skeleton-pulse skeleton-text title"></div>
                    <div class="skeleton skeleton-pulse skeleton-text"></div>
                    <div class="skeleton skeleton-pulse skeleton-text"></div>
                    <div class="skeleton skeleton-pulse skeleton-text short" style="margin-top:20px;"></div>
                </div>
            `;
        }
        return html;
    }
};
