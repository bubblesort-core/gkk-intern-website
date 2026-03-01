/**
 * Project Workspace Logic
 * Handles the display and interaction for the Intern Project Section.
 */

(function () {
    const STATE = {
        project: null,
        submission: null,
        team: null,
        user: null
    };

    // Initialize the Workspace
    window.initProjectWorkspace = async function (user, team) {

        STATE.user = user;
        STATE.team = team;

        const loadingEl = document.getElementById('projectLoading');
        const contentEl = document.getElementById('projectContent');
        const emptyEl = document.getElementById('projectEmpty');

        try {
            // 1. Fetch Assigned Project
            const project = await fetchAssignedProject(team.id);

            if (!project) {
                loadingEl.style.display = 'none';
                emptyEl.style.display = 'block';
                return;
            }

            STATE.project = project;

            // 2. Fetch Existing Submission
            const submission = await fetchSubmission(team.id, project.id);
            STATE.submission = submission;

            // 3. render UI
            renderProjectUI(project, submission, team);

            // 4. Setup Event Listeners
            setupSubmissionForm();

            loadingEl.style.display = 'none';
            contentEl.style.display = 'block';

        } catch (error) {
            console.error('Workspace Init Error:', error);
            loadingEl.innerHTML = `<p style="color: var(--ws-error);">Failed to load project details.</p>`;
        }
    };

    // --- Data Fetching ---

    async function fetchAssignedProject(teamId) {
        const { data, error } = await supabaseClient
            .from('projects')
            .select('*') // Select all columns including 'tech_stack' (array) and 'description'
            .eq('assigned_team_id', teamId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async function fetchSubmission(teamId, projectId) {
        const { data, error } = await supabaseClient
            .from('project_submissions')
            .select('*')
            .eq('team_id', teamId)
            .eq('project_id', projectId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
            console.warn('Error fetching submission:', error);
        }
        return data;
    }

    // --- Rendering ---

    function renderProjectUI(project, submission, team) {
        // Text Fields
        document.getElementById('wsTitle').textContent = project.title;
        document.getElementById('wsDeadline').textContent = formatDate(project.deadline);
        document.getElementById('wsTeamName').textContent = team.team_name || 'My Team';
        document.getElementById('wsDescription').textContent = project.description || 'No description provided.';

        // Status Badge
        const statusBadge = document.getElementById('wsStatusBadge');
        let status = 'Assigned';
        let statusClass = 'pending';
        let statusMessage = '';

        // Logic to determine status display
        // Priority: Submission Status > Project Status (if specific) > Default 'Assigned'

        if (submission) {
            status = 'Submitted';
            statusClass = 'submitted';
            if (submission.status === 'approved') {
                status = 'Approved ✓';
                statusClass = 'active';
                statusMessage = '🎉 Congratulations! Your project has been approved by the admin.';
            } else if (submission.status === 'changes_requested') {
                status = 'Changes Requested';
                statusClass = 'warning';
                statusMessage = '⚠️ Your submission requires changes. Please review the feedback and resubmit.';
            } else if (submission.status === 'rejected') {
                status = 'Rejected';
                statusClass = 'error';
                statusMessage = '❌ Your submission was rejected. Please review the requirements and submit again.';
            } else if (submission.status === 'submitted' || submission.status === 'pending') {
                status = 'Submitted';
                statusClass = 'submitted';
                statusMessage = '📤 Your project has been submitted and is awaiting review.';
            }
        } else if (project.status) {
            // Check admin-set project status
            if (project.status === 'under_review' || project.status === 'reviewing') {
                status = 'Under Review';
                statusClass = 'info';
                statusMessage = '🔍 Your project is currently being reviewed by the admin.';
            } else if (project.status === 'rejected') {
                status = 'Rejected';
                statusClass = 'error';
                statusMessage = '❌ This project was rejected. Please contact your admin or mentor for more details.';
            } else if (project.status === 'approved') {
                status = 'Approved ✓';
                statusClass = 'active';
                statusMessage = '🎉 Congratulations! Your project has been approved!';
            } else if (project.status === 'completed') {
                status = 'Completed';
                statusClass = 'active';
                statusMessage = '✅ This project has been marked as complete.';
            } else if (project.status === 'in_progress') {
                status = 'In Progress';
                statusClass = 'primary';
                statusMessage = '🚀 Project is in progress. Keep up the good work!';
            } else if (project.status === 'changes_requested') {
                status = 'Changes Requested';
                statusClass = 'warning';
                statusMessage = '⚠️ Changes have been requested. Please review and update your submission.';
            }
        }

        statusBadge.textContent = status;
        statusBadge.className = `ws-status-badge ${statusClass}`;

        // Display status message if exists
        let statusMsgEl = document.getElementById('wsStatusMessage');
        if (!statusMsgEl) {
            // Create the element if it doesn't exist
            statusMsgEl = document.createElement('div');
            statusMsgEl.id = 'wsStatusMessage';
            statusMsgEl.style.cssText = 'padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem;';
            // Insert after status badge's parent
            const badgeParent = statusBadge.parentElement;
            if (badgeParent && badgeParent.parentElement) {
                badgeParent.parentElement.insertBefore(statusMsgEl, badgeParent.nextSibling);
            }
        }

        if (statusMessage) {
            statusMsgEl.style.display = 'block';
            // Set background color based on status
            if (statusClass === 'error') {
                statusMsgEl.style.background = 'rgba(239, 68, 68, 0.1)';
                statusMsgEl.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                statusMsgEl.style.color = '#fca5a5';
            } else if (statusClass === 'warning') {
                statusMsgEl.style.background = 'rgba(245, 158, 11, 0.1)';
                statusMsgEl.style.border = '1px solid rgba(245, 158, 11, 0.3)';
                statusMsgEl.style.color = '#fcd34d';
            } else if (statusClass === 'active') {
                statusMsgEl.style.background = 'rgba(16, 185, 129, 0.1)';
                statusMsgEl.style.border = '1px solid rgba(16, 185, 129, 0.3)';
                statusMsgEl.style.color = '#6ee7b7';
            } else if (statusClass === 'info') {
                statusMsgEl.style.background = 'rgba(59, 130, 246, 0.1)';
                statusMsgEl.style.border = '1px solid rgba(59, 130, 246, 0.3)';
                statusMsgEl.style.color = '#93c5fd';
            } else {
                statusMsgEl.style.background = 'rgba(148, 163, 184, 0.1)';
                statusMsgEl.style.border = '1px solid rgba(148, 163, 184, 0.3)';
                statusMsgEl.style.color = '#cbd5e1';
            }
            statusMsgEl.textContent = statusMessage;
        } else {
            statusMsgEl.style.display = 'none';
        }

        // Display admin feedback if available
        let feedbackEl = document.getElementById('wsAdminFeedback');
        if (!feedbackEl) {
            feedbackEl = document.createElement('div');
            feedbackEl.id = 'wsAdminFeedback';
            feedbackEl.style.cssText = 'padding: 16px; border-radius: 8px; margin-bottom: 16px; background: var(--c-bg-card); border: 1px solid var(--c-border);';
            // Insert after status message
            if (statusMsgEl && statusMsgEl.parentElement) {
                statusMsgEl.parentElement.insertBefore(feedbackEl, statusMsgEl.nextSibling);
            }
        }

        if (submission && submission.feedback) {
            feedbackEl.style.display = 'block';
            feedbackEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <i class="fas fa-comment-alt" style="color: var(--c-primary);"></i>
                    <span style="font-weight: 600; font-size: 0.9rem; color: var(--c-text-primary);">Admin Feedback</span>
                    ${submission.reviewed_at ? `<span style="font-size: 0.75rem; color: var(--c-text-muted); margin-left: auto;">${new Date(submission.reviewed_at).toLocaleDateString()}</span>` : ''}
                </div>
                <p style="font-size: 0.9rem; color: var(--c-text-secondary); margin: 0; line-height: 1.5; white-space: pre-wrap;">${submission.feedback}</p>
            `;
        } else {
            feedbackEl.style.display = 'none';
        }

        // Handle submit button state based on status
        const submitBtn = document.getElementById('btnSubmitProject');
        const submitForm = document.getElementById('submissionForm');

        if (submitBtn && submitForm) {
            // Allow resubmission for rejected/changes_requested status
            const canResubmit = !submission ||
                submission.status === 'rejected' ||
                submission.status === 'changes_requested' ||
                project.status === 'rejected' ||
                project.status === 'changes_requested';

            const isApproved = (submission && submission.status === 'approved') ||
                project.status === 'approved' ||
                project.status === 'completed';

            if (isApproved) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Project Approved';
                submitBtn.style.opacity = '0.6';
                submitBtn.style.cursor = 'not-allowed';
            } else if (submission && canResubmit) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-redo"></i> Resubmit Project';
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            } else if (submission) {
                submitBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Update Submission';
            }
        }

        // Tech Stack
        const stackContainer = document.getElementById('wsTechStack');
        stackContainer.innerHTML = '';
        if (project.tech_stack && Array.isArray(project.tech_stack)) {
            project.tech_stack.forEach(tech => {
                const tag = document.createElement('span');
                tag.className = 'tech-tag';
                tag.textContent = tech;
                stackContainer.appendChild(tag);
            });
        } else {
            stackContainer.textContent = 'No specific tech stack defined.';
        }

        // Team List
        const teamList = document.getElementById('wsTeamList');
        teamList.innerHTML = '';
        if (team.members) {
            team.members.forEach(m => {
                const div = document.createElement('div');
                div.style.cssText = 'display: flex; align-items: center; gap: 10px; font-size: 0.9rem; padding: 6px; border-radius: 4px; background: rgba(255,255,255,0.02);';
                div.innerHTML = `
                    <div style="width: 24px; height: 24px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">${getInitials(m.name)}</div>
                    <div>${m.name} ${m.role === 'leader' ? '⭐' : ''}</div>
                `;
                teamList.appendChild(div);
            });
        }

        // Resources (Mock for now, or check if 'resources' column exists)
        // If project.resources is a JSON/Array
        const resourcesList = document.getElementById('wsResourcesList');
        resourcesList.innerHTML = '';
        if (project.resources && Array.isArray(project.resources) && project.resources.length > 0) {
            project.resources.forEach(res => {
                const a = document.createElement('a');
                a.href = res.url;
                a.target = '_blank';
                a.className = 'resource-item';
                a.innerHTML = `<i class="fas fa-external-link-alt"></i> ${res.title}`;
                resourcesList.appendChild(a);
            });
        } else {
            resourcesList.innerHTML = '<div style="color: var(--ws-text-secondary); font-size: 0.9rem;">No resources attached.</div>';
        }

        // Fill Form if submitted
        if (submission) {
            document.getElementById('subGithub').value = submission.github_url || '';
            document.getElementById('subLive').value = submission.live_url || '';
            // Change button to "Update"
            const btn = document.getElementById('btnSubmitProject');
            btn.innerHTML = `<i class="fas fa-sync-alt"></i> Update Submission`;
        }

        renderProgressTracker(project, submission);
    }

    function renderProgressTracker(project, submission) {
        // Simple linear stages
        const stages = [
            { id: 'assigned', label: 'Assigned' },
            { id: 'dev', label: 'In Progress' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'review', label: 'Under Review' },
            { id: 'completed', label: 'Completed' }
        ];

        // Determine current stage index
        let currentIdx = 0; // 'assigned'

        if (submission) {
            currentIdx = 2; // 'submitted'
            if (submission.status === 'reviewing' || submission.status === 'under_review') currentIdx = 3;
            if (submission.status === 'approved') currentIdx = 4;
        } else if (project.status) {
            // Sync tracker with project status
            if (project.status === 'in_progress') currentIdx = 1;
            if (project.status === 'under_review' || project.status === 'reviewing') currentIdx = 3;
            if (project.status === 'completed' || project.status === 'approved') currentIdx = 4;
        }

        const trackPath = document.getElementById('wsProgressTrack');
        // Clear existing steps (except line fill)
        const existingFill = document.getElementById('wsProgressFill');
        trackPath.innerHTML = '';
        trackPath.appendChild(existingFill);

        stages.forEach((stage, idx) => {
            const step = document.createElement('div');

            let statusClass = '';
            if (idx <= currentIdx) statusClass = 'active'; // Active or completed (past)
            // Visual tweak: if strictly less than current, maybe style differently? 
            // For now 'active' means "reached this stage".

            // To differentiate "completed steps" vs "current active step", we can add logic.
            // But CSS uses .active to light it up.

            step.className = `progress-step ${statusClass}`;
            step.innerHTML = `
                <div class="step-dot"><i class="fas fa-check"></i></div>
                <div class="step-label">${stage.label}</div>
            `;
            trackPath.appendChild(step);
        });

        // Update Fill Width
        // 0 steps = 0%, 4 steps = 100%. 
        // We have 4 intervals for 5 steps.
        const percent = (currentIdx / (stages.length - 1)) * 100;
        existingFill.style.width = `${percent}%`;
    }

    // --- Actions ---

    function setupSubmissionForm() {
        const form = document.getElementById('submissionForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmitProject');
            const originalText = btn.innerHTML;

            const githubUrl = document.getElementById('subGithub').value;
            const liveUrl = document.getElementById('subLive').value;

            // Basic Validation
            if (!githubUrl) return Swal.fire('Error', 'GitHub URL is required', 'error');

            try {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                btn.disabled = true;

                const payload = {
                    project_id: STATE.project.id,
                    team_id: STATE.team.id,
                    submitted_by: STATE.user.id,
                    github_url: githubUrl,
                    live_url: liveUrl,
                    submission_date: new Date().toISOString(), // Update timestamp
                    status: 'submitted' // Reset status to submitted on update
                };

                // Check if updating or inserting
                let error;
                if (STATE.submission) {
                    // Update
                    const { error: upError } = await supabaseClient
                        .from('project_submissions')
                        .update(payload)
                        .eq('id', STATE.submission.id);
                    error = upError;
                } else {
                    // Insert
                    const { error: inError } = await supabaseClient
                        .from('project_submissions')
                        .insert([payload]);
                    error = inError;
                }

                if (error) throw error;

                // Award XP for new submission (not updates)
                const isNewSubmission = !STATE.submission;
                if (isNewSubmission && typeof awardXP === 'function') {
                    awardXP(STATE.user.id, 50, 'Project Submitted');
                }

                // Success
                Swal.fire({
                    title: 'Submitted!',
                    text: 'Your project has been submitted for review.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Refresh Data
                const newSub = await fetchSubmission(STATE.team.id, STATE.project.id);
                STATE.submission = newSub;
                renderProjectUI(STATE.project, newSub, STATE.team);

            } catch (err) {
                console.error('Submission Error:', err);
                Swal.fire('Error', 'Failed to submit project. Please try again.', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };
    }

    // --- Helpers ---
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function getInitials(name) {
        return name ? name.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase() : '??';
    }

})();
