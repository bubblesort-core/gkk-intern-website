/**
 * Admin Smart Features - specialized logic for Gkk-Hire Admin
 */

const SmartFeatures = {
    // Calculate match score between a project's tech stack and a team's combined skills
    calculateMatchScore: function (projectTechStack, teamMembers) {
        if (!projectTechStack || projectTechStack.length === 0) return 100; // No requirements
        if (!teamMembers || teamMembers.length === 0) return 0; // No members

        // Aggregate team skills
        const teamSkills = new Set();
        teamMembers.forEach(member => {
            if (member.profiles && member.profiles.skills) {
                member.profiles.skills.forEach(skill => teamSkills.add(skill.toLowerCase()));
            }
        });

        // Count matches
        let matches = 0;
        projectTechStack.forEach(tech => {
            if (teamSkills.has(tech.toLowerCase())) {
                matches++;
            }
        });

        return Math.round((matches / projectTechStack.length) * 100);
    },

    // Wizard State Management
    Wizard: class {
        constructor(steps, onComplete) {
            this.steps = steps; // Array of step IDs
            this.currentStep = 0;
            this.data = {};
            this.onComplete = onComplete;
        }

        init() {
            this.showStep(0);
        }

        next() {
            if (this.validateStep(this.currentStep)) {
                this.saveStepData(this.currentStep);
                if (this.currentStep < this.steps.length - 1) {
                    this.currentStep++;
                    this.showStep(this.currentStep);
                } else {
                    this.complete();
                }
            }
        }

        prev() {
            if (this.currentStep > 0) {
                this.currentStep--;
                this.showStep(this.currentStep);
            }
        }

        showStep(index) {
            this.steps.forEach((stepId, i) => {
                const el = document.getElementById(stepId);
                if (el) {
                    el.style.display = i === index ? 'block' : 'none';
                    el.classList.toggle('active', i === index);
                }

                // Update indicators if they exist
                const indicator = document.querySelector(`[data-step="${i}"]`);
                if (indicator) {
                    indicator.classList.toggle('active', i === index);
                    indicator.classList.toggle('completed', i < index);
                }
            });

            // Update buttons
            const prevBtn = document.getElementById('wizardPrevBtn');
            const nextBtn = document.getElementById('wizardNextBtn');
            const submitBtn = document.getElementById('wizardSubmitBtn');

            if (prevBtn) prevBtn.style.display = index === 0 ? 'none' : 'inline-block';
            if (nextBtn) nextBtn.style.display = index === this.steps.length - 1 ? 'none' : 'inline-block';
            if (submitBtn) submitBtn.style.display = index === this.steps.length - 1 ? 'inline-block' : 'none';
        }

        validateStep(index) {
            // Basic validation: check required inputs in the current step container
            const stepEl = document.getElementById(this.steps[index]);
            if (!stepEl) return true;

            const inputs = stepEl.querySelectorAll('[required]');
            let isValid = true;
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('error');
                    // Simple shake animation or tooltip could be added here
                } else {
                    input.classList.remove('error');
                }
            });
            return isValid;
        }

        saveStepData(index) {
            const stepEl = document.getElementById(this.steps[index]);
            if (!stepEl) return;

            const inputs = stepEl.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.name || input.id) {
                    this.data[input.name || input.id] = input.value;
                }
            });
        }

        complete() {
            if (this.onComplete) {
                this.onComplete(this.data);
            }
        }
    }
};

window.SmartFeatures = SmartFeatures;
