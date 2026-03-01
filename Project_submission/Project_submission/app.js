/**
 * Project Submission - Instagram/GitHub Hybrid
 * Role-based permissions with team leader upload control
 */

// ============================================
// Configuration & Data
// ============================================
const CONFIG = {
    STORAGE_KEYS: {
        FILES: 'project_files',
        POSTS: 'project_posts',
        COMMENTS: 'project_comments',
        README: 'project_readme',
        DEPLOY_URL: 'project_deploy_url',
        CURRENT_USER: 'current_user_id'
    }
};

// User Roles
const ROLES = {
    LEADER: 'leader',
    MEMBER: 'member',
    ADMIN: 'admin'
};

// Role Permissions
const PERMISSIONS = {
    [ROLES.LEADER]: {
        canUpload: true,
        canDelete: true,
        canComment: true,
        canEditReadme: true,
        canViewAll: true
    },
    [ROLES.MEMBER]: {
        canUpload: false,
        canDelete: false,
        canComment: true,
        canEditReadme: false,
        canViewAll: true
    },
    [ROLES.ADMIN]: {
        canUpload: false,
        canDelete: false,
        canComment: true,
        canEditReadme: false,
        canViewAll: true
    }
};

// Batch & Team Data
const BATCHES = {
    "2024": [
        { id: "T001", name: "Team Alpha", password: "alpha123", icon: "🚀" },
        { id: "T002", name: "Team Beta", password: "beta123", icon: "⚡" },
        { id: "T003", name: "Team Gamma", password: "gamma123", icon: "🔥" },
        { id: "T004", name: "Team Delta", password: "delta123", icon: "💫" }
    ],
    "2025": [
        { id: "T101", name: "Team Phoenix", password: "phoenix123", icon: "🦅" },
        { id: "T102", name: "Team Dragon", password: "dragon123", icon: "🐉" },
        { id: "T103", name: "Team Thunder", password: "thunder123", icon: "⛈️" }
    ],
    "2026": [
        { id: "T201", name: "Team Innovators", password: "innov123", icon: "💡" },
        { id: "T202", name: "Team Builders", password: "build123", icon: "🏗️" },
        { id: "T203", name: "Team Pioneers", password: "pioneer123", icon: "🌟" },
        { id: "T204", name: "Team Creators", password: "create123", icon: "🎨" },
        { id: "T205", name: "Team Explorers", password: "explore123", icon: "🔭" }
    ]
};

// Team members with ROLES
const TEAM_MEMBERS = [
    { id: 1, name: 'Alex Chen', initials: 'AC', color: '#0095f6', role: ROLES.LEADER, title: 'Team Leader' },
    { id: 2, name: 'Sarah Kim', initials: 'SK', color: '#8b5cf6', role: ROLES.MEMBER, title: 'Frontend Dev' },
    { id: 3, name: 'Mike Johnson', initials: 'MJ', color: '#ec4899', role: ROLES.MEMBER, title: 'Backend Dev' },
    { id: 4, name: 'Emily Davis', initials: 'ED', color: '#22c55e', role: ROLES.MEMBER, title: 'UI/UX Designer' }
];

// Company Admins
const COMPANY_ADMINS = [
    { id: 100, name: 'Admin User', initials: 'AD', color: '#f59e0b', role: ROLES.ADMIN, title: 'Company Admin' }
];

// All users combined
const ALL_USERS = [...TEAM_MEMBERS, ...COMPANY_ADMINS];

// State
let currentUser = TEAM_MEMBERS[0]; // Default to team leader
let currentTeam = null;
let currentBatch = null;
let selectedTeamForAuth = null;

// ============================================
// Helper Functions
// ============================================
function canUserUpload() {
    return PERMISSIONS[currentUser.role]?.canUpload === true;
}

function canUserDelete() {
    return PERMISSIONS[currentUser.role]?.canDelete === true;
}

function canUserComment() {
    return PERMISSIONS[currentUser.role]?.canComment === true;
}

function canUserEditReadme() {
    return PERMISSIONS[currentUser.role]?.canEditReadme === true;
}

function isTeamLeader() {
    return currentUser.role === ROLES.LEADER;
}

function isAdmin() {
    return currentUser.role === ROLES.ADMIN;
}

function getRoleBadgeClass(role) {
    if (role === ROLES.LEADER) return 'role-leader';
    if (role === ROLES.ADMIN) return 'role-admin';
    return 'role-member';
}

function getRoleBadgeText(role) {
    if (role === ROLES.LEADER) return '👑 Leader';
    if (role === ROLES.ADMIN) return '🛡️ Admin';
    return 'Member';
}

// ============================================
// Screen Navigator
// ============================================
class ScreenNavigator {
    constructor() {
        this.screens = {
            landing: document.getElementById('landingScreen'),
            batch: document.getElementById('batchScreen'),
            team: document.getElementById('teamScreen'),
            project: document.getElementById('projectScreen')
        };
        this.currentScreen = 'landing';
    }

    navigateTo(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
    }
}

// ============================================
// Project State
// ============================================
class ProjectState {
    constructor() {
        this.files = this.load(CONFIG.STORAGE_KEYS.FILES) || [];
        this.posts = this.load(CONFIG.STORAGE_KEYS.POSTS) || [];
        this.comments = this.load(CONFIG.STORAGE_KEYS.COMMENTS) || [];
        this.readme = this.load(CONFIG.STORAGE_KEYS.README) || this.getDefaultReadme();
        this.deployUrl = this.load(CONFIG.STORAGE_KEYS.DEPLOY_URL) || '';
    }

    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving:', e);
        }
    }

    getDefaultReadme() {
        return `# Project Title\n\nWelcome to our team project!\n\n## Features\n- Feature 1\n- Feature 2\n\n## Setup\n\`\`\`bash\nnpm install\nnpm start\n\`\`\``;
    }

    addFile(file, content) {
        if (!canUserUpload()) {
            showToast('Only team leader can upload files', 'error');
            return null;
        }

        const existingIndex = this.files.findIndex(f => f.name === file.name);
        const fileData = {
            id: Date.now(),
            name: file.name,
            size: file.size,
            type: file.type,
            content: content,
            uploadedBy: currentUser,
            uploadedAt: new Date().toISOString(),
            version: existingIndex >= 0 ? this.files[existingIndex].version + 1 : 1
        };

        if (existingIndex >= 0) {
            this.files[existingIndex] = fileData;
        } else {
            this.files.push(fileData);
        }

        this.save(CONFIG.STORAGE_KEYS.FILES, this.files);
        return fileData;
    }

    deleteFile(fileName) {
        if (!canUserDelete()) {
            showToast('Only team leader can delete files', 'error');
            return;
        }
        this.files = this.files.filter(f => f.name !== fileName);
        this.save(CONFIG.STORAGE_KEYS.FILES, this.files);
    }

    addPost(message, files) {
        const post = {
            id: Date.now(),
            message: message,
            files: files,
            user: currentUser,
            timestamp: new Date().toISOString(),
            likes: [],
            postComments: []
        };
        this.posts.unshift(post);
        this.save(CONFIG.STORAGE_KEYS.POSTS, this.posts);
        return post;
    }

    addPostComment(postId, text) {
        if (!canUserComment()) {
            showToast('You cannot comment', 'error');
            return null;
        }

        const post = this.posts.find(p => p.id === postId);
        if (post) {
            if (!post.postComments) post.postComments = [];
            const comment = {
                id: Date.now(),
                text: text,
                user: currentUser,
                timestamp: new Date().toISOString()
            };
            post.postComments.push(comment);
            this.save(CONFIG.STORAGE_KEYS.POSTS, this.posts);
            return comment;
        }
        return null;
    }

    likePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            const likeIndex = post.likes.indexOf(currentUser.id);
            if (likeIndex >= 0) {
                post.likes.splice(likeIndex, 1);
            } else {
                post.likes.push(currentUser.id);
            }
            this.save(CONFIG.STORAGE_KEYS.POSTS, this.posts);
        }
        return post;
    }

    deletePost(postId) {
        if (!canUserDelete()) {
            showToast('Only team leader can delete posts', 'error');
            return;
        }
        this.posts = this.posts.filter(p => p.id !== postId);
        this.save(CONFIG.STORAGE_KEYS.POSTS, this.posts);
    }

    addComment(text) {
        if (!canUserComment()) {
            showToast('You cannot comment', 'error');
            return null;
        }

        const comment = {
            id: Date.now(),
            text: text,
            user: currentUser,
            timestamp: new Date().toISOString()
        };
        this.comments.push(comment);
        this.save(CONFIG.STORAGE_KEYS.COMMENTS, this.comments);
        return comment;
    }

    updateReadme(content) {
        if (!canUserEditReadme()) {
            showToast('Only team leader can edit README', 'error');
            return;
        }
        this.readme = content;
        this.save(CONFIG.STORAGE_KEYS.README, content);
    }

    updateDeployUrl(url) {
        this.deployUrl = url;
        this.save(CONFIG.STORAGE_KEYS.DEPLOY_URL, url);
    }
}

// ============================================
// UI Renderer
// ============================================
class UIRenderer {
    constructor(state) {
        this.state = state;
    }

    renderBatchTags() {
        const container = document.getElementById('batchTags');
        if (!container) return;
        container.innerHTML = '';
        Object.keys(BATCHES).forEach(batch => {
            const tag = document.createElement('span');
            tag.className = 'batch-tag';
            tag.textContent = batch;
            tag.onclick = () => document.getElementById('batchInput').value = batch;
            container.appendChild(tag);
        });
    }

    renderTeams(batchNumber) {
        const container = document.getElementById('teamsGrid');
        const badge = document.getElementById('selectedBatchBadge');
        if (!container) return;

        badge.textContent = `Batch ${batchNumber}`;
        container.innerHTML = '';

        const teams = BATCHES[batchNumber] || [];
        teams.forEach(team => {
            const card = document.createElement('div');
            card.className = 'team-card';
            card.innerHTML = `
                <div class="team-card-icon">${team.icon}</div>
                <div class="team-card-id">${team.id}</div>
                <div class="team-card-name">${team.name}</div>
                <div class="team-card-action">
                    <span>Enter Workspace</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </div>
            `;
            card.onclick = () => this.showPasswordModal(team);
            container.appendChild(card);
        });
    }

    showPasswordModal(team) {
        selectedTeamForAuth = team;
        const modal = document.getElementById('teamPasswordModal');
        const teamName = document.getElementById('modalTeamName');
        const input = document.getElementById('teamPasswordInput');
        const hint = document.getElementById('passwordHint');

        teamName.textContent = team.name;
        input.value = '';
        hint.textContent = '';
        modal.classList.add('active');
        input.focus();
    }

    hidePasswordModal() {
        document.getElementById('teamPasswordModal').classList.remove('active');
        selectedTeamForAuth = null;
    }

    verifyPassword(password) {
        const hint = document.getElementById('passwordHint');
        if (!selectedTeamForAuth) return false;

        if (password === selectedTeamForAuth.password) {
            currentTeam = selectedTeamForAuth;
            this.hidePasswordModal();
            return true;
        } else {
            hint.textContent = 'Incorrect password. Try again.';
            return false;
        }
    }

    updateProjectPage() {
        if (!currentTeam) return;

        // Nav
        document.getElementById('navTeamIcon').textContent = currentTeam.icon;
        document.getElementById('navTeamName').textContent = currentTeam.name;
        document.getElementById('navBatchBadge').textContent = `Batch ${currentBatch}`;

        // Current user indicator in nav
        this.updateCurrentUserIndicator();

        // Team profile
        document.getElementById('teamAvatarLarge').textContent = currentTeam.icon;
        document.getElementById('teamNameLarge').textContent = currentTeam.name;

        // Stats
        document.getElementById('statFiles').textContent = this.state.files.length;
        document.getElementById('statCommits').textContent = this.state.posts.length;
        document.getElementById('statMembers').textContent = TEAM_MEMBERS.length;

        // Info
        document.getElementById('infoTeamId').textContent = currentTeam.id;
        document.getElementById('infoBatch').textContent = currentBatch;

        // Preview URL
        const urlInput = document.getElementById('previewUrlInput');
        const previewLink = document.getElementById('previewLink');
        urlInput.value = this.state.deployUrl;
        previewLink.href = this.state.deployUrl || '#';

        // Update permissions-based UI
        this.updatePermissionsUI();
    }

    updateCurrentUserIndicator() {
        const indicator = document.getElementById('currentUserIndicator');
        if (indicator) {
            indicator.innerHTML = `
                <div class="current-user-avatar" style="background: ${currentUser.color}">${currentUser.initials}</div>
                <span class="current-user-name">${currentUser.name}</span>
                <span class="current-user-role ${getRoleBadgeClass(currentUser.role)}">${getRoleBadgeText(currentUser.role)}</span>
            `;
        }
    }

    updatePermissionsUI() {
        // Show/hide upload section based on role
        const uploadCard = document.querySelector('.upload-card');
        const uploadFolderBtn = document.getElementById('uploadFolderBtn');
        const createReadmeBtn = document.getElementById('createReadmeBtn');

        if (uploadCard) {
            if (canUserUpload()) {
                uploadCard.classList.remove('disabled');
                uploadCard.style.opacity = '1';
                uploadCard.style.pointerEvents = 'auto';
            } else {
                uploadCard.classList.add('disabled');
                uploadCard.style.opacity = '0.5';
                uploadCard.style.pointerEvents = 'none';
            }
        }

        if (uploadFolderBtn) {
            uploadFolderBtn.disabled = !canUserUpload();
            uploadFolderBtn.style.opacity = canUserUpload() ? '1' : '0.5';
        }

        if (createReadmeBtn) {
            createReadmeBtn.disabled = !canUserEditReadme();
            createReadmeBtn.style.opacity = canUserEditReadme() ? '1' : '0.5';
        }

        // Update permission notice
        const permissionNotice = document.getElementById('permissionNotice');
        if (permissionNotice) {
            if (!canUserUpload()) {
                permissionNotice.textContent = isAdmin()
                    ? '🛡️ Admin Mode: View & Comment only'
                    : '👤 Member Mode: View & Comment only';
                permissionNotice.classList.remove('hidden');
            } else {
                permissionNotice.textContent = '👑 Leader Mode: Full access';
                permissionNotice.classList.remove('hidden');
            }
        }
    }

    renderTeamMembers() {
        const container = document.getElementById('teamMembersList');
        if (!container) return;
        container.innerHTML = '';

        // Render team members
        TEAM_MEMBERS.forEach(member => {
            const item = this.createMemberItem(member, member.id === currentUser.id);
            container.appendChild(item);
        });

        // Add separator for admins
        if (COMPANY_ADMINS.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'members-separator';
            separator.innerHTML = '<span>Company Admins</span>';
            container.appendChild(separator);

            COMPANY_ADMINS.forEach(admin => {
                const item = this.createMemberItem(admin, admin.id === currentUser.id);
                container.appendChild(item);
            });
        }
    }

    createMemberItem(member, isActive) {
        const item = document.createElement('div');
        item.className = `member-item ${isActive ? 'active-user' : ''}`;
        item.innerHTML = `
            <div class="member-avatar" style="background: ${member.color}">
                ${member.initials}
                ${isActive ? '<span class="active-dot"></span>' : ''}
            </div>
            <div class="member-info">
                <div class="member-name">
                    ${member.name}
                    ${isActive ? '<span class="you-badge">You</span>' : ''}
                </div>
                <div class="member-role">${member.title}</div>
            </div>
            <div class="member-role-badge ${getRoleBadgeClass(member.role)}">
                ${member.role === ROLES.LEADER ? '👑' : member.role === ROLES.ADMIN ? '🛡️' : ''}
            </div>
        `;
        // User switching disabled
        item.style.cursor = 'default';
        return item;
    }

    renderFeed() {
        const container = document.getElementById('projectFeed');
        const emptyFeed = document.getElementById('emptyFeed');
        if (!container) return;

        if (this.state.posts.length === 0) {
            container.innerHTML = '';
            container.appendChild(emptyFeed);
            emptyFeed.classList.remove('hidden');
            return;
        }

        emptyFeed.classList.add('hidden');
        container.innerHTML = '';

        this.state.posts.forEach(post => {
            const card = this.createPostCard(post);
            container.appendChild(card);
        });
    }

    createPostCard(post) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.dataset.postId = post.id;

        const isLiked = post.likes.includes(currentUser.id);
        const timeAgo = this.formatTimeAgo(post.timestamp);
        const postComments = post.postComments || [];

        // Files HTML
        let filesHtml = '';
        if (post.files && post.files.length > 0) {
            filesHtml = `<div class="post-files">
                ${post.files.map(f => `
                    <div class="post-file" data-filename="${f.name}">
                        <span class="post-file-icon">${this.getFileIcon(f.name)}</span>
                        <span class="post-file-name">${f.name}</span>
                        <span class="post-file-size">${this.formatSize(f.size)}</span>
                    </div>
                `).join('')}
            </div>`;
        }

        // Comments HTML
        let commentsHtml = '';
        if (postComments.length > 0) {
            commentsHtml = `
                <div class="post-comments">
                    ${postComments.slice(-3).map(c => `
                        <div class="post-comment">
                            <span class="comment-user" style="color: ${c.user.color}">${c.user.name}</span>
                            <span class="comment-text">${this.escapeHtml(c.text)}</span>
                        </div>
                    `).join('')}
                    ${postComments.length > 3 ? `<span class="view-all-comments">View all ${postComments.length} comments</span>` : ''}
                </div>
            `;
        }

        card.innerHTML = `
            <div class="post-header">
                <div class="post-avatar" style="background: ${post.user.color}">${post.user.initials}</div>
                <div class="post-user-info">
                    <div class="post-username">
                        ${post.user.name}
                        <span class="post-user-role ${getRoleBadgeClass(post.user.role)}">${post.user.role === ROLES.LEADER ? '👑' : ''}</span>
                    </div>
                    <div class="post-time">${timeAgo}</div>
                </div>
                ${canUserDelete() ? '<button class="post-menu delete-post-btn" title="Delete">🗑️</button>' : ''}
            </div>
            <div class="post-content">
                ${post.message ? `<p class="post-message">${this.escapeHtml(post.message)}</p>` : ''}
                ${filesHtml}
            </div>
            <div class="post-actions">
                <button class="post-action-btn like-btn ${isLiked ? 'liked' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span>${post.likes.length || ''}</span>
                </button>
                <button class="post-action-btn comment-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>${postComments.length || ''}</span>
                </button>
                <button class="post-action-btn download-all-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </button>
            </div>
            ${commentsHtml}
            <div class="post-add-comment">
                <input type="text" class="post-comment-input" placeholder="Add a comment...">
                <button class="post-comment-submit">Post</button>
            </div>
        `;

        // Event listeners
        card.querySelector('.like-btn').onclick = () => {
            this.state.likePost(post.id);
            this.renderFeed();
        };

        card.querySelector('.download-all-btn').onclick = () => {
            if (post.files) {
                post.files.forEach(f => {
                    const file = this.state.files.find(sf => sf.name === f.name);
                    if (file) this.downloadFile(file);
                });
            }
        };

        const deleteBtn = card.querySelector('.delete-post-btn');
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                this.state.deletePost(post.id);
                this.renderFeed();
                this.updateProjectPage();
                showToast('Post deleted', 'success');
            };
        }

        // Comment input
        const commentInput = card.querySelector('.post-comment-input');
        const commentSubmit = card.querySelector('.post-comment-submit');

        commentSubmit.onclick = () => {
            const text = commentInput.value.trim();
            if (text) {
                this.state.addPostComment(post.id, text);
                commentInput.value = '';
                this.renderFeed();
            }
        };

        commentInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                commentSubmit.click();
            }
        };

        // File clicks
        card.querySelectorAll('.post-file').forEach(el => {
            el.onclick = () => {
                const filename = el.dataset.filename;
                const file = this.state.files.find(f => f.name === filename);
                if (file) this.downloadFile(file);
            };
        });

        return card;
    }

    renderComments() {
        const container = document.getElementById('commentsContainer');
        const empty = document.getElementById('emptyComments');
        if (!container) return;

        if (this.state.comments.length === 0) {
            container.innerHTML = '';
            container.appendChild(empty);
            empty.classList.remove('hidden');
            return;
        }

        empty.classList.add('hidden');
        container.innerHTML = '';

        this.state.comments.slice(-20).forEach(comment => {
            const item = document.createElement('div');
            item.className = 'comment-item';
            item.innerHTML = `
                <div class="comment-avatar" style="background: ${comment.user.color}">${comment.user.initials}</div>
                <div class="comment-bubble">
                    <div class="comment-author">
                        ${comment.user.name}
                        <span class="comment-role ${getRoleBadgeClass(comment.user.role)}">${comment.user.role === ROLES.LEADER ? '👑' : comment.user.role === ROLES.ADMIN ? '🛡️' : ''}</span>
                    </div>
                    <div class="comment-text">${this.escapeHtml(comment.text)}</div>
                    <div class="comment-time">${this.formatTimeAgo(comment.timestamp)}</div>
                </div>
            `;
            container.appendChild(item);
        });

        container.scrollTop = container.scrollHeight;
    }

    renderFilesModal() {
        const container = document.getElementById('filesListContainer');
        if (!container) return;

        container.innerHTML = '';

        if (this.state.files.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-tertiary);padding:40px;">No files uploaded yet</p>';
            return;
        }

        this.state.files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'file-list-item';
            item.innerHTML = `
                <span class="file-icon">${this.getFileIcon(file.name)}</span>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">${this.formatSize(file.size)} • ${this.formatTimeAgo(file.uploadedAt)} • by ${file.uploadedBy.name}</div>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn download-btn" title="Download">⬇️</button>
                    ${canUserDelete() ? '<button class="file-action-btn delete delete-btn" title="Delete">🗑️</button>' : ''}
                </div>
            `;

            item.querySelector('.download-btn').onclick = () => this.downloadFile(file);

            const deleteBtn = item.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.onclick = () => {
                    this.state.deleteFile(file.name);
                    this.renderFilesModal();
                    this.updateProjectPage();
                    showToast(`Deleted ${file.name}`, 'success');
                };
            }

            container.appendChild(item);
        });
    }

    // Utilities
    downloadFile(file) {
        try {
            const byteString = atob(file.content.split(',')[1] || file.content);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: file.type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(`Downloaded ${file.name}`, 'success');
        } catch (e) {
            showToast(`Failed to download`, 'error');
        }
    }

    getFileIcon(name) {
        const ext = name.split('.').pop().toLowerCase();
        const icons = {
            'html': '📄', 'htm': '📄', 'css': '🎨', 'js': '⚡', 'ts': '💎',
            'json': '📋', 'md': '📝', 'txt': '📃', 'png': '🖼️', 'jpg': '🖼️',
            'jpeg': '🖼️', 'gif': '🖼️', 'svg': '🖼️', 'pdf': '📕', 'zip': '📦',
            'py': '🐍', 'java': '☕', 'jsx': '⚛️', 'tsx': '⚛️', 'vue': '💚'
        };
        return icons[ext] || '📎';
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ============================================
// File Uploader
// ============================================
class FileUploader {
    constructor(state, renderer) {
        this.state = state;
        this.renderer = renderer;
        this.init();
    }

    init() {
        const dropzone = document.getElementById('uploadDropzone');
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseBtn');

        if (!dropzone) return;

        browseBtn.onclick = (e) => {
            e.stopPropagation();
            if (!canUserUpload()) {
                showToast('Only team leader can upload files', 'error');
                return;
            }
            fileInput.click();
        };

        dropzone.onclick = () => {
            if (!canUserUpload()) {
                showToast('Only team leader can upload files', 'error');
                return;
            }
            fileInput.click();
        };

        fileInput.onchange = (e) => this.handleFiles(e.target.files);

        dropzone.ondragover = (e) => {
            e.preventDefault();
            if (canUserUpload()) {
                dropzone.classList.add('dragover');
            }
        };

        dropzone.ondragleave = (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        };

        dropzone.ondrop = async (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');

            if (!canUserUpload()) {
                showToast('Only team leader can upload files', 'error');
                return;
            }

            const items = e.dataTransfer.items;
            const allFiles = [];

            if (items && items.length > 0) {
                for (let i = 0; i < items.length; i++) {
                    const entry = items[i].webkitGetAsEntry?.();
                    if (entry) {
                        await this.traverseEntry(entry, '', allFiles);
                    } else {
                        const file = items[i].getAsFile();
                        if (file) allFiles.push({ file, path: file.name });
                    }
                }
                await this.processFiles(allFiles);
            } else {
                await this.handleFiles(e.dataTransfer.files);
            }
        };
    }

    async traverseEntry(entry, path, filesArray) {
        if (entry.isFile) {
            const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
            const fullPath = path ? `${path}/${entry.name}` : entry.name;
            filesArray.push({ file, path: fullPath });
        } else if (entry.isDirectory) {
            const dirPath = path ? `${path}/${entry.name}` : entry.name;
            const reader = entry.createReader();
            const entries = await new Promise((resolve, reject) => {
                const all = [];
                const read = () => {
                    reader.readEntries(e => {
                        if (e.length === 0) resolve(all);
                        else { all.push(...e); read(); }
                    }, reject);
                };
                read();
            });
            for (const child of entries) {
                await this.traverseEntry(child, dirPath, filesArray);
            }
        }
    }

    async handleFiles(fileList) {
        if (!canUserUpload()) {
            showToast('Only team leader can upload files', 'error');
            return;
        }
        const files = Array.from(fileList);
        const allFiles = files.map(f => ({ file: f, path: f.name }));
        await this.processFiles(allFiles);
    }

    async processFiles(filesArray) {
        const uploadedFiles = [];
        const createPost = document.getElementById('createPostCheck')?.checked ?? true;

        for (const { file, path } of filesArray) {
            try {
                const content = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                const fileData = this.state.addFile({ name: path, size: file.size, type: file.type }, content);
                if (fileData) {
                    uploadedFiles.push({ name: path, size: file.size, type: file.type });
                }
            } catch (e) {
                showToast(`Failed to upload ${path}`, 'error');
            }
        }

        if (uploadedFiles.length > 0) {
            if (createPost) {
                const message = uploadedFiles.length === 1
                    ? `Uploaded ${uploadedFiles[0].name}`
                    : `Uploaded ${uploadedFiles.length} files`;
                this.state.addPost(message, uploadedFiles);
            }

            this.renderer.renderFeed();
            this.renderer.updateProjectPage();
            showToast(`Uploaded ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`, 'success');
        }
    }
}

// ============================================
// Toast
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { 'success': '✅', 'error': '❌', 'warning': '⚠️', 'info': 'ℹ️' };
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// Initialize App
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const navigator = new ScreenNavigator();
    const state = new ProjectState();
    const renderer = new UIRenderer(state);
    const uploader = new FileUploader(state, renderer);

    renderer.renderBatchTags();

    // Landing
    document.getElementById('enterBtn')?.addEventListener('click', () => navigator.navigateTo('batch'));

    // Batch
    document.getElementById('backToLanding')?.addEventListener('click', () => navigator.navigateTo('landing'));

    const batchInput = document.getElementById('batchInput');
    const batchHint = document.getElementById('batchHint');
    const batchContinue = document.getElementById('batchContinueBtn');

    batchInput?.addEventListener('input', () => {
        const val = batchInput.value.trim();
        if (val && !BATCHES[val]) {
            batchHint.textContent = 'Batch not found';
            batchHint.className = 'input-hint error';
        } else if (val && BATCHES[val]) {
            batchHint.textContent = `${BATCHES[val].length} teams found`;
            batchHint.className = 'input-hint success';
        } else {
            batchHint.textContent = '';
        }
    });

    batchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') batchContinue.click();
    });

    batchContinue?.addEventListener('click', () => {
        const val = batchInput.value.trim();
        if (BATCHES[val]) {
            currentBatch = val;
            renderer.renderTeams(val);
            navigator.navigateTo('team');
        } else {
            batchHint.textContent = 'Please enter a valid batch number';
            batchHint.className = 'input-hint error';
        }
    });

    // Team
    document.getElementById('backToBatch')?.addEventListener('click', () => navigator.navigateTo('batch'));

    document.getElementById('cancelTeamModal')?.addEventListener('click', () => renderer.hidePasswordModal());

    document.getElementById('teamPasswordInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('confirmTeamAccess').click();
    });

    document.getElementById('confirmTeamAccess')?.addEventListener('click', () => {
        const password = document.getElementById('teamPasswordInput').value;
        if (renderer.verifyPassword(password)) {
            renderer.updateProjectPage();
            renderer.renderTeamMembers();
            renderer.renderFeed();
            renderer.renderComments();
            navigator.navigateTo('project');
            showToast(`Welcome to ${currentTeam.name}!`, 'success');
        }
    });

    document.getElementById('teamPasswordModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'teamPasswordModal') renderer.hidePasswordModal();
    });

    // Project page
    document.getElementById('exitBtn')?.addEventListener('click', () => {
        currentTeam = null;
        currentBatch = null;
        navigator.navigateTo('landing');
        showToast('Logged out', 'info');
    });

    // Preview URL
    document.getElementById('savePreviewUrl')?.addEventListener('click', () => {
        const url = document.getElementById('previewUrlInput').value;
        state.updateDeployUrl(url);
        document.getElementById('previewLink').href = url || '#';
        showToast('URL saved', 'success');
    });

    // README
    document.getElementById('createReadmeBtn')?.addEventListener('click', () => {
        if (!canUserEditReadme()) {
            showToast('Only team leader can edit README', 'error');
            return;
        }
        document.getElementById('readmeTextarea').value = state.readme;
        document.getElementById('readmeModal').classList.add('active');
    });

    document.getElementById('closeReadmeModal')?.addEventListener('click', () => {
        document.getElementById('readmeModal').classList.remove('active');
    });

    document.getElementById('cancelReadmeBtn')?.addEventListener('click', () => {
        document.getElementById('readmeModal').classList.remove('active');
    });

    document.getElementById('saveReadmeBtn')?.addEventListener('click', () => {
        state.updateReadme(document.getElementById('readmeTextarea').value);
        document.getElementById('readmeModal').classList.remove('active');
        showToast('README saved', 'success');
    });

    // All Files
    document.getElementById('viewAllFilesBtn')?.addEventListener('click', () => {
        renderer.renderFilesModal();
        document.getElementById('filesModal').classList.add('active');
    });

    document.getElementById('closeFilesModal')?.addEventListener('click', () => {
        document.getElementById('filesModal').classList.remove('active');
    });

    // Folder upload
    document.getElementById('uploadFolderBtn')?.addEventListener('click', () => {
        if (!canUserUpload()) {
            showToast('Only team leader can upload files', 'error');
            return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.onchange = (e) => uploader.handleFiles(e.target.files);
        input.click();
    });

    // Team Chat
    const commentInput = document.getElementById('commentInput');
    const sendComment = document.getElementById('sendCommentBtn');

    sendComment?.addEventListener('click', () => {
        const text = commentInput.value.trim();
        if (text) {
            state.addComment(text);
            commentInput.value = '';
            renderer.renderComments();
        }
    });

    commentInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendComment.click();
        }
    });

    // Modal overlays
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                overlay.classList.remove('active');
            }
        });
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        }
    });
});
