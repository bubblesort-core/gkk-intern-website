const fs = require('fs');

const htmlContent = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Merchandise | GKK Interns Admin</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Minimal CSS -->
    <link rel="stylesheet" href="../css/admin-minimal.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="icon" type="image/png" href="../assets/favicon.png">

    <style>
        .banner-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }

        .banner-card {
            background: var(--c-bg-card);
            border: 1px solid var(--c-border);
            border-radius: 12px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .banner-card.active {
            border-top: 4px solid #10b981;
        }
        
        .banner-card.inactive {
            border-top: 4px solid #4b5563;
        }

        .settings-card {
            background: var(--c-bg-card);
            border: 1px solid var(--c-border);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
        }
        
        .badge-active {
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .badge-inactive {
            background: rgba(75, 85, 99, 0.15);
            color: #9ca3af;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
    </style>
</head>

<body>
    <!-- Mobile Sidebar Overlay -->
    <div class="sidebar-overlay" id="sidebarOverlay"
        style="position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:45; display:none;"></div>

    <div class="admin-layout">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <!-- Injected via admin-sidebar.js -->
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="top-header">
                <div class="header-left" style="display: flex; align-items: center; gap: 16px;">
                    <button class="mobile-menu-btn" onclick="toggleSidebar()">
                        <i class="fas fa-bars"></i>
                    </button>
                    <h1 class="page-title">Merchandise Management</h1>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary btn-sm" onclick="openProductModal()">
                        <i class="fas fa-plus"></i> Add Product
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="loadData()" title="Refresh Data">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </header>

            <div class="page-body">
                <div id="loadingIndicator" style="text-align: center; padding: 3rem; color: var(--c-text-muted);">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem; color: var(--c-primary);"></i>
                    <p>Loading...</p>
                </div>
                
                <div id="contentArea" style="display: none;">
                    <div class="settings-card">
                        <h3 style="margin-top: 0; margin-bottom: 1rem;">Store Settings</h3>
                        <div class="form-row">
                            <div>
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--c-text-primary); margin-bottom: 1rem;">
                                    <input type="checkbox" id="storeOpenToggle" style="width: 18px; height: 18px; accent-color: var(--c-primary);">
                                    Store is Open
                                </label>
                            </div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 4px; color: var(--c-text-secondary); font-size: 0.85rem;">Lock Message (Shown when closed)</label>
                            <input type="text" id="lockMessageInput" class="form-input"
                                style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--c-border); background: rgba(0,0,0,0.2); color: white;">
                        </div>
                        <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="saveSettings()" id="btnSaveSettings">Save Settings</button>
                    </div>

                    <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Products</h3>
                    <div id="noProductsMsg" style="display: none; text-align: center; padding: 3rem; opacity: 0.6; background: var(--c-bg-card); border-radius: 12px; border: 1px solid var(--c-border);">
                        <i class="fas fa-tshirt" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>No products found. Add your first one!</p>
                    </div>

                    <div class="banner-grid" id="productsGrid">
                        <!-- Products injected here -->
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Product Form Modal -->
    <div class="modal-overlay" id="productModal" style="display:none;">
        <div class="modal-container" style="max-width: 600px; width: 100%;">
            <div class="modal-header">
                <h3 class="modal-title" id="modalTitle">Add Product</h3>
                <button class="modal-close" onclick="closeProductModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <input type="hidden" id="editProductId">
                <div style="display: grid; gap: 1rem;">
                    
                    <div>
                        <label style="display: block; margin-bottom: 4px; color: var(--c-text-secondary); font-size: 0.85rem;">Name *</label>
                        <input type="text" id="prodName" class="form-input" 
                            style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--c-border); background: rgba(0,0,0,0.2); color: white;">
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 4px; color: var(--c-text-secondary); font-size: 0.85rem;">Slug (URL identifier) *</label>
                        <input type="text" id="prodSlug" class="form-input" 
                            style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--c-border); background: rgba(0,0,0,0.2); color: white;">
                    </div>
                    
                    <div class="form-row">
                        <div>
                            <label style="display: block; margin-bottom: 4px; color: var(--c-text-secondary); font-size: 0.85rem;">Price *</label>
                            <input type="number" id="prodPrice" class="form-input" 
                                style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--c-border); background: rgba(0,0,0,0.2); color: white;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 4px; color: var(--c-text-secondary); font-size: 0.85rem;">Compare At Price</label>
                            <input type="number" id="prodComparePrice" class="form-input" 
                                style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--c-border); background: rgba(0,0,0,0.2); color: white;">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 4px; color: var(--c-text-secondary); font-size: 0.85rem;">Payment Link</label>
                        <input type="text" id="prodPaymentLink" class="form-input" 
                            style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--c-border); background: rgba(0,0,0,0.2); color: white;">
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 4px; color: var(--c-text-secondary); font-size: 0.85rem;">Image URL</label>
                        <input type="url" id="prodImage" class="form-input" 
                            style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--c-border); background: rgba(0,0,0,0.2); color: white;">
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 4px; color: var(--c-text-secondary); font-size: 0.85rem;">Description</label>
                        <textarea id="prodDesc" rows="3" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--c-border); background: rgba(0,0,0,0.2); color: white; resize: vertical;"></textarea>
                    </div>

                    <div style="margin-top: 8px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--c-text-primary);">
                            <input type="checkbox" id="prodActive" style="width: 18px; height: 18px; accent-color: var(--c-primary);" checked>
                            Active
                        </label>
                    </div>

                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeProductModal()" id="btnCancel">Cancel</button>
                <button class="btn btn-primary" onclick="saveProduct()" id="btnSaveProd">Save Product</button>
            </div>
        </div>
    </div>

    <!-- SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="../js/supabase-client.js"></script>
    <script src="../js/admin-sidebar.js"></script>
    <script src="../js/admin-router.js"></script>
    <script src="../js/main-page-btn.js"></script>

    <script>
        // Sidebar Mobile Toggle
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            sidebar.classList.toggle('open');
            if (sidebar.classList.contains('open')) overlay.style.display = 'block';
            else overlay.style.display = 'none';
        }
        document.getElementById('sidebarOverlay')?.addEventListener('click', () => toggleSidebar());

        let allProducts = [];
        let currentSettings = null;

        async function init() {
            if (!await ensureAdminAuth()) return;
            loadData();
        }

        async function loadData() {
            document.getElementById('loadingIndicator').style.display = 'block';
            document.getElementById('contentArea').style.display = 'none';

            try {
                // Load Settings
                const { data: settingsData, error: settingsError } = await supabaseClient
                    .from('merchandise_settings')
                    .select('*')
                    .eq('id', 1)
                    .single();
                
                if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
                
                if (settingsData) {
                    currentSettings = settingsData;
                    document.getElementById('storeOpenToggle').checked = settingsData.is_store_open;
                    document.getElementById('lockMessageInput').value = settingsData.lock_message || '';
                }

                // Load Products
                const { data: productsData, error: productsError } = await supabaseClient
                    .from('merchandise_products')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (productsError) throw productsError;
                allProducts = productsData || [];
                renderProducts();

                document.getElementById('contentArea').style.display = 'block';
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'Failed to load merchandise data.', 'error');
            } finally {
                document.getElementById('loadingIndicator').style.display = 'none';
            }
        }

        async function saveSettings() {
            const isOpen = document.getElementById('storeOpenToggle').checked;
            const lockMsg = document.getElementById('lockMessageInput').value.trim();
            
            const btn = document.getElementById('btnSaveSettings');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            btn.disabled = true;

            try {
                const payload = {
                    is_store_open: isOpen,
                    lock_message: lockMsg
                };

                const { error } = await supabaseClient
                    .from('merchandise_settings')
                    .upsert({ id: 1, ...payload });

                if (error) throw error;
                Swal.fire({icon: 'success', title: 'Settings Saved', toast: true, position:'top-end', showConfirmButton:false, timer:2000, background:'#1e293b', color: '#fff'});
            } catch (err) {
                Swal.fire({icon: 'error', title: 'Error', text: err.message, background: '#1e293b', color: '#fff'});
            } finally {
                btn.innerHTML = 'Save Settings';
                btn.disabled = false;
            }
        }

        function renderProducts() {
            const grid = document.getElementById('productsGrid');
            grid.innerHTML = '';

            if (allProducts.length === 0) {
                document.getElementById('noProductsMsg').style.display = 'block';
                return;
            }
            document.getElementById('noProductsMsg').style.display = 'none';

            let html = '';
            allProducts.forEach(p => {
                let imgUrl = '';
                if (p.images && p.images.length > 0) {
                    imgUrl = p.images[0];
                }

                html += \`
                <div class="banner-card \${p.is_active ? 'active' : 'inactive'}">
                    \${imgUrl ? \`<img src="\${escapeHtml(imgUrl)}" style="width:100%; height:200px; object-fit:contain; background:#fff; border-radius:8px; margin-bottom:12px;">\` : ''}
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                        <h3 style="margin:0; font-size:1.1rem;">\${escapeHtml(p.name)}</h3>
                        <span class="\${p.is_active ? 'badge-active' : 'badge-inactive'}">
                            \${p.is_active ? 'Active' : 'Draft'}
                        </span>
                    </div>
                    <p style="font-size:0.9rem; color:var(--c-text-secondary); flex: 1; margin:0 0 16px 0;">₹\${p.price}</p>
                    <div style="display:flex; gap:0.5rem; margin-top:auto; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.05);">
                        <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="editProduct('\${p.id}')"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn btn-secondary btn-sm" style="flex:1; color:#ef4444; border-color:rgba(239,68,68,0.3);" onclick="deleteProduct('\${p.id}')"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </div>\`;
            });
            grid.innerHTML = html;
        }

        function openProductModal() {
            document.getElementById('modalTitle').textContent = 'Add Product';
            document.getElementById('editProductId').value = '';
            document.getElementById('prodName').value = '';
            document.getElementById('prodSlug').value = '';
            document.getElementById('prodPrice').value = '';
            document.getElementById('prodComparePrice').value = '';
            document.getElementById('prodDesc').value = '';
            document.getElementById('prodImage').value = '';
            document.getElementById('prodPaymentLink').value = '';
            document.getElementById('prodActive').checked = true;
            
            const modal = document.getElementById('productModal');
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('open'), 10);
        }

        function editProduct(id) {
            const p = allProducts.find(x => x.id === id);
            if (!p) return;

            document.getElementById('modalTitle').textContent = 'Edit Product';
            document.getElementById('editProductId').value = p.id;
            document.getElementById('prodName').value = p.name;
            document.getElementById('prodSlug').value = p.slug;
            document.getElementById('prodPrice').value = p.price;
            document.getElementById('prodComparePrice').value = p.compare_at_price || '';
            document.getElementById('prodDesc').value = p.description || '';
            document.getElementById('prodPaymentLink').value = p.payment_link || '';
            document.getElementById('prodImage').value = (p.images && p.images.length > 0) ? p.images[0] : '';
            document.getElementById('prodActive').checked = p.is_active;

            const modal = document.getElementById('productModal');
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('open'), 10);
        }

        function closeProductModal() {
            const modal = document.getElementById('productModal');
            modal.classList.remove('open');
            setTimeout(() => modal.style.display = 'none', 300);
        }

        async function saveProduct() {
            const id = document.getElementById('editProductId').value;
            const name = document.getElementById('prodName').value.trim();
            const slug = document.getElementById('prodSlug').value.trim();
            const price = parseFloat(document.getElementById('prodPrice').value);
            const comparePrice = parseFloat(document.getElementById('prodComparePrice').value) || null;
            const desc = document.getElementById('prodDesc').value.trim();
            const image = document.getElementById('prodImage').value.trim();
            const paymentLink = document.getElementById('prodPaymentLink').value.trim();
            const isActive = document.getElementById('prodActive').checked;
            
            if (!name || !slug || isNaN(price)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Missing Fields',
                    text: 'Name, Slug, and Price are required!',
                    background: '#1e293b', color: '#fff'
                });
                return;
            }

            const payload = {
                name: name,
                slug: slug,
                price: price,
                compare_at_price: comparePrice,
                description: desc,
                images: image ? [image] : [],
                payment_link: paymentLink,
                is_active: isActive
            };

            const btnSave = document.getElementById('btnSaveProd');
            const originalText = btnSave.innerHTML;
            btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            btnSave.disabled = true;

            try {
                if (id) {
                    const { error } = await supabaseClient.from('merchandise_products').update(payload).eq('id', id);
                    if (error) throw error;
                    Swal.fire({icon: 'success', title: 'Updated!', toast: true, position:'top-end', showConfirmButton:false, timer:2000, background:'#1e293b', color: '#fff' });
                } else {
                    const { error } = await supabaseClient.from('merchandise_products').insert([payload]);
                    if (error) throw error;
                    Swal.fire({icon: 'success', title: 'Created!', toast: true, position:'top-end', showConfirmButton:false, timer:2000, background:'#1e293b', color: '#fff' });
                }
                closeProductModal();
                loadData();
            } catch (err) {
                Swal.fire({icon: 'error', title: 'Error', text: err.message, background: '#1e293b', color: '#fff'});
            } finally {
                btnSave.innerHTML = originalText;
                btnSave.disabled = false;
            }
        }

        async function deleteProduct(id) {
            const res = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#3b82f6',
                confirmButtonText: 'Yes, delete it!',
                background: '#1e293b', color: '#fff'
            });

            if (res.isConfirmed) {
                try {
                    const { error } = await supabaseClient.from('merchandise_products').delete().eq('id', id);
                    if (error) throw error;
                    Swal.fire({icon: 'success', title: 'Deleted!', toast: true, position:'top-end', showConfirmButton:false, timer:2000, background:'#1e293b', color: '#fff' });
                    loadData();
                } catch (err) {
                    Swal.fire({icon: 'error', title: 'Error', text: err.message, background: '#1e293b', color: '#fff'});
                }
            }
        }

        function escapeHtml(unsafe) {
            if (!unsafe) return '';
            return unsafe
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
         }

        init();
    </script>
    <script src="../js/admin-identity.js"></script>
</body>

</html>`;

fs.writeFileSync('d:\\WEBSITES BUILT\\Gkk-hire\\Dashboard\\public\\admin\\merchandise.html', htmlContent);
console.log('Successfully created merchandise.html');
