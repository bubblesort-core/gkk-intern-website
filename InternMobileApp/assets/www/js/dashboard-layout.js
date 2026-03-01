/**
 * Dashboard Layout Manager
 * Enables drag-and-drop reordering of dashboard widgets
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'gkk_dashboard_layout';
    const DEFAULT_ORDER = ['stats', 'welcome', 'announcements', 'meetings', 'team-preview', 'projects-preview'];

    let sortableInstance = null;
    let isEditMode = false;

    // Initialize layout manager
    function initDashboardLayout() {
        const widgetGrid = document.getElementById('widgetGrid');
        if (!widgetGrid) {

            return;
        }

        // Load saved order
        loadSavedLayout();

        // Initialize Sortable.js
        if (typeof Sortable !== 'undefined') {
            sortableInstance = new Sortable(widgetGrid, {
                animation: 150,
                ghostClass: 'widget-ghost',
                chosenClass: 'widget-chosen',
                dragClass: 'widget-drag',
                handle: '.widget-drag-handle',
                disabled: true, // Start disabled, enable in edit mode
                onEnd: function () {
                    saveLayout();
                }
            });
        }

        // Setup edit mode toggle
        setupEditModeToggle();
    }

    // Load saved layout from localStorage or cookie
    function loadSavedLayout() {
        try {
            let saved = null;
            if (window.CookieManager) {
                saved = window.CookieManager.getPreference(STORAGE_KEY);
            } else {
                saved = localStorage.getItem(STORAGE_KEY);
            }

            if (saved) {
                const order = JSON.parse(saved);
                reorderWidgets(order);
            }
        } catch (e) {
            console.warn('Failed to load dashboard layout:', e);
        }
    }

    // Save current layout to cookie or localStorage
    function saveLayout() {
        const widgetGrid = document.getElementById('widgetGrid');
        if (!widgetGrid) return;

        const widgets = widgetGrid.querySelectorAll('.widget-item');
        const order = Array.from(widgets).map(w => w.dataset.widgetId);

        try {
            const orderData = JSON.stringify(order);
            if (window.CookieManager) {
                window.CookieManager.setPreference(STORAGE_KEY, orderData, 365);
            } else {
                localStorage.setItem(STORAGE_KEY, orderData);
            }
            showLayoutToast('Layout saved!');
        } catch (e) {
            console.warn('Failed to save layout:', e);
        }
    }

    // Reorder widgets based on saved order
    function reorderWidgets(order) {
        const widgetGrid = document.getElementById('widgetGrid');
        if (!widgetGrid) return;

        order.forEach(widgetId => {
            const widget = widgetGrid.querySelector(`[data-widget-id="${widgetId}"]`);
            if (widget) {
                widgetGrid.appendChild(widget);
            }
        });
    }

    // Reset to default layout
    function resetLayout() {
        // Remove from both cookie and localStorage
        if (window.CookieManager) {
            window.CookieManager.deletePreference(STORAGE_KEY);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
        reorderWidgets(DEFAULT_ORDER);
        showLayoutToast('Layout reset to default');
    }

    // Toggle edit mode
    function toggleEditMode() {
        isEditMode = !isEditMode;
        const widgetGrid = document.getElementById('widgetGrid');
        const editBtn = document.getElementById('layoutEditBtn');

        if (widgetGrid) {
            widgetGrid.classList.toggle('edit-mode', isEditMode);
        }

        if (editBtn) {
            editBtn.innerHTML = isEditMode
                ? '<i class="fas fa-check"></i> Done'
                : '<i class="fas fa-th-large"></i> Customize';
            editBtn.classList.toggle('active', isEditMode);
        }

        // Toggle Sortable
        if (sortableInstance) {
            sortableInstance.option('disabled', !isEditMode);
        }

        if (!isEditMode) {
            saveLayout();
        }
    }

    // Setup edit mode button
    function setupEditModeToggle() {
        const editBtn = document.getElementById('layoutEditBtn');
        if (editBtn) {
            editBtn.addEventListener('click', toggleEditMode);
        }
    }

    // Show toast notification
    function showLayoutToast(message) {
        if (typeof Swal !== 'undefined') {
            const Toast = Swal.mixin({
                toast: true,
                position: 'bottom-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#f8fafc'
            });
            Toast.fire({ icon: 'success', title: message });
        }
    }

    // Expose globally
    window.initDashboardLayout = initDashboardLayout;
    window.resetDashboardLayout = resetLayout;
    window.toggleLayoutEditMode = toggleEditMode;

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboardLayout);
    } else {
        // Small delay to ensure all elements are rendered
        setTimeout(initDashboardLayout, 100);
    }
})();
