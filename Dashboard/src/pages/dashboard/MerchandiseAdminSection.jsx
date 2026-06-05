import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import Swal from 'sweetalert2';
import { FiSettings, FiPackage, FiMessageSquare, FiPlus, FiTrash, FiEdit, FiMove, FiImage, FiList } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function MerchandiseAdminSection() {
    const { supabase, isAdmin } = useDashboard();
    const [activeTab, setActiveTab] = useState('products'); // settings, products, reviews
    
    if (!isAdmin) {
        return (
            <div className="dash-section-ready">
                <div className="dash-locked-banner">
                    <div className="dash-locked-icon-wrap"><i className="fas fa-lock" /></div>
                    <div>
                        <h3>Access Denied</h3>
                        <p>You do not have permission to view this page.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dash-section-ready">
            <div className="dash-bento-grid">
                <section className="dash-bento-tile dash-bento-w2" data-tone="lavender" style={{ gridColumn: '1 / -1' }}>
                    <div className="dash-tile-header" style={{ marginBottom: '1.5rem' }}>
                        <h2>Merchandise Control Center</h2>
                        <p className="dash-tile-subtitle">Manage store settings, products, layouts, and reviews.</p>
                    </div>
                    
                    {/* Tabs Navigation */}
                    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <button 
                            onClick={() => setActiveTab('products')} 
                            style={{ background: 'none', border: 'none', color: activeTab === 'products' ? '#3b82f6' : '#94a3b8', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FiPackage /> Products
                        </button>
                        <button 
                            onClick={() => setActiveTab('settings')} 
                            style={{ background: 'none', border: 'none', color: activeTab === 'settings' ? '#3b82f6' : '#94a3b8', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FiSettings /> Store & Layout Settings
                        </button>
                        <button 
                            onClick={() => setActiveTab('reviews')} 
                            style={{ background: 'none', border: 'none', color: activeTab === 'reviews' ? '#3b82f6' : '#94a3b8', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FiMessageSquare /> Reviews
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'products' && <ProductsManager key="products" supabase={supabase} />}
                        {activeTab === 'settings' && <SettingsManager key="settings" supabase={supabase} />}
                        {activeTab === 'reviews' && <ReviewsManager key="reviews" supabase={supabase} />}
                    </AnimatePresence>
                </section>
            </div>
        </div>
    );
}

// --- STORE & LAYOUT SETTINGS ---
function SettingsManager({ supabase }) {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [isStoreOpen, setIsStoreOpen] = useState(true);
    const [lockMessage, setLockMessage] = useState('');
    const [bannerType, setBannerType] = useState('none');
    const [bannerMessage, setBannerMessage] = useState('');
    const [layoutSections, setLayoutSections] = useState(['gallery', 'details', 'reviews']);

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            let { data, error } = await supabase.from('merchandise_settings').select('*').eq('id', 1).single();
            if (error) {
                // Try creating it if it doesn't exist
                if (error.code === 'PGRST116') {
                    const { data: newData, error: insertErr } = await supabase.from('merchandise_settings').insert([{id: 1}]).select().single();
                    if (insertErr) throw insertErr;
                    data = newData;
                } else {
                    throw error;
                }
            }
            if (data) {
                setSettings(data);
                setIsStoreOpen(data.is_store_open);
                setLockMessage(data.lock_message || '');
                setBannerType(data.banner_type || 'none');
                setBannerMessage(data.banner_message || '');
                if (data.layout_config && data.layout_config.sections) {
                    setLayoutSections(data.layout_config.sections);
                }
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Could not load store settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('merchandise_settings').update({
                is_store_open: isStoreOpen,
                lock_message: lockMessage,
                banner_type: bannerType,
                banner_message: bannerMessage,
                layout_config: { sections: layoutSections },
                updated_at: new Date().toISOString()
            }).eq('id', 1);

            if (error) throw error;
            Swal.fire('Saved!', 'Store settings updated successfully', 'success');
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Could not save settings', 'error');
        }
    };

    const moveSection = (index, dir) => {
        const newSections = [...layoutSections];
        const targetIndex = index + dir;
        if (targetIndex < 0 || targetIndex >= newSections.length) return;
        
        const temp = newSections[index];
        newSections[index] = newSections[targetIndex];
        newSections[targetIndex] = temp;
        setLayoutSections(newSections);
    };

    if (loading) return <p>Loading settings...</p>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                
                {/* Store Status */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.1rem' }}>Store Status</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input type="checkbox" id="isStoreOpen" checked={isStoreOpen} onChange={e => setIsStoreOpen(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem' }} />
                        <label htmlFor="isStoreOpen" style={{ color: '#cbd5e1', cursor: 'pointer', fontWeight: 600 }}>Store is Open (Active)</label>
                    </div>
                    {!isStoreOpen && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Closed Note / Lock Message</label>
                            <textarea value={lockMessage} onChange={e => setLockMessage(e.target.value)} rows="3" placeholder="e.g. We are currently updating our inventory. Back soon!" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                        </div>
                    )}
                </div>

                {/* Banner Settings */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.1rem' }}>Global Banner</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Banner Type</label>
                            <select value={bannerType} onChange={e => setBannerType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }}>
                                <option value="none">None (Hidden)</option>
                                <option value="info">Info (Blue)</option>
                                <option value="success">Success / Sale (Green)</option>
                                <option value="warning">Warning / Alert (Yellow)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Banner Message</label>
                            <input type="text" value={bannerMessage} onChange={e => setBannerMessage(e.target.value)} placeholder="e.g. Huge Summer Sale! 20% off all merch." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                        </div>
                    </div>
                </div>

                {/* Page Builder / Layout */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.1rem' }}>Product Page Layout Builder</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>Drag or click arrows to reorder how sections appear on the Product Details page.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {layoutSections.map((section, idx) => (
                            <div key={section} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <FiMove style={{ color: '#64748b' }} />
                                    <span style={{ color: 'white', fontWeight: 500, textTransform: 'capitalize' }}>
                                        {section} {section === 'gallery' && '(Images & Video)'} {section === 'details' && '(Description, Price, Buy Button)'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx === 0} style={{ padding: '0.5rem', borderRadius: '0.25rem', background: idx === 0 ? 'transparent' : '#1e293b', border: 'none', color: idx === 0 ? '#334155' : 'white', cursor: idx === 0 ? 'default' : 'pointer' }}>↑</button>
                                    <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx === layoutSections.length - 1} style={{ padding: '0.5rem', borderRadius: '0.25rem', background: idx === layoutSections.length - 1 ? 'transparent' : '#1e293b', border: 'none', color: idx === layoutSections.length - 1 ? '#334155' : 'white', cursor: idx === layoutSections.length - 1 ? 'default' : 'pointer' }}>↓</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button type="submit" className="dash-btn dash-btn-primary" style={{ alignSelf: 'flex-start', padding: '1rem 2rem', fontSize: '1.1rem' }}>
                    Save All Settings
                </button>
            </form>
        </motion.div>
    );
}

// --- PRODUCTS MANAGER ---
function ProductsManager({ supabase }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState(null);
    const [slug, setSlug] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [comparePrice, setComparePrice] = useState('');
    const [images, setImages] = useState(['']); // Array of URLs
    const [features, setFeatures] = useState(['']); // Array of strings
    const [customFields, setCustomFields] = useState([]); // Array of {label, value}
    const [stockStatus, setStockStatus] = useState('in_stock');
    const [paymentService, setPaymentService] = useState('razorpay');
    const [paymentLink, setPaymentLink] = useState('');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('merchandise_products').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to load merchandise', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const productData = {
                slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                name,
                description,
                price: parseFloat(price),
                compare_at_price: comparePrice ? parseFloat(comparePrice) : null,
                images: images.filter(i => i.trim() !== ''),
                features: features.filter(f => f.trim() !== ''),
                custom_fields: customFields.filter(f => f.label.trim() !== '' && f.value.trim() !== ''),
                stock_status: stockStatus,
                payment_service: paymentService,
                payment_link: paymentLink,
                is_active: isActive
            };

            let error;
            if (editingId) {
                const res = await supabase.from('merchandise_products').update(productData).eq('id', editingId);
                error = res.error;
            } else {
                const res = await supabase.from('merchandise_products').insert([productData]);
                error = res.error;
            }

            if (error) throw error;
            
            // Clear the Redis cache
            try {
                await supabase.functions.invoke('get-merchandise-products', {
                    body: { clear_cache: true }
                });
            } catch (e) {
                console.warn('Failed to clear cache:', e);
            }
            
            Swal.fire('Success', `Product ${editingId ? 'updated' : 'added'} successfully!`, 'success');
            setIsFormOpen(false);
            resetForm();
            fetchProducts();
        } catch (err) {
            console.error('Save error:', err);
            Swal.fire('Error', err.message || 'Failed to save product', 'error');
        }
    };

    const handleEdit = (prod) => {
        setEditingId(prod.id);
        setSlug(prod.slug);
        setName(prod.name);
        setDescription(prod.description || '');
        setPrice(prod.price);
        setComparePrice(prod.compare_at_price || '');
        setImages(prod.images && prod.images.length > 0 ? prod.images : ['']);
        setFeatures(prod.features && prod.features.length > 0 ? prod.features : ['']);
        setCustomFields(prod.custom_fields && prod.custom_fields.length > 0 ? prod.custom_fields : []);
        setStockStatus(prod.stock_status || 'in_stock');
        setPaymentService(prod.payment_service || 'razorpay');
        setPaymentLink(prod.payment_link || '');
        setIsActive(prod.is_active);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({ title: 'Are you sure?', text: "You won't be able to revert this!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, delete it!' });
        if (result.isConfirmed) {
            try {
                const { error } = await supabase.from('merchandise_products').delete().eq('id', id);
                if (error) throw error;
                
                // Clear the Redis cache
                try {
                    await supabase.functions.invoke('get-merchandise-products', {
                        body: { clear_cache: true }
                    });
                } catch (e) {
                    console.warn('Failed to clear cache:', e);
                }

                Swal.fire('Deleted!', 'Product has been deleted.', 'success');
                fetchProducts();
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'Failed to delete product', 'error');
            }
        }
    };

    const resetForm = () => {
        setEditingId(null); setSlug(''); setName(''); setDescription(''); setPrice(''); setComparePrice('');
        setImages(['']); setFeatures(['']); setCustomFields([]); setStockStatus('in_stock');
        setPaymentService('razorpay'); setPaymentLink(''); setIsActive(true);
    };

    const handleArrayChange = (setter, index, value) => {
        setter(prev => {
            const arr = [...prev];
            arr[index] = value;
            return arr;
        });
    };

    const addArrayItem = (setter, emptyValue = '') => setter(prev => [...prev, emptyValue]);
    const removeArrayItem = (setter, index) => setter(prev => prev.filter((_, i) => i !== index));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button className="dash-btn dash-btn-primary" onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}>
                    {isFormOpen ? 'Cancel' : <><FiPlus /> Add New Product</>}
                </button>
            </div>

            {isFormOpen && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'white' }}>{editingId ? 'Edit Product' : 'Create New Product'}</h3>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Product Name</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Slug (URL Path)</label>
                                <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. gkk-premium-tshirt" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                                <small style={{ color: '#64748b' }}>Leave blank to auto-generate from name.</small>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Price (₹)</label>
                                <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Compare at Price (₹)</label>
                                <input type="number" step="0.01" value={comparePrice} onChange={e => setComparePrice(e.target.value)} placeholder="Crossed out price" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Stock Status</label>
                                <select value={stockStatus} onChange={e => setStockStatus(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }}>
                                    <option value="in_stock">In Stock</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                </select>
                            </div>
                        </div>

                        {/* Images Gallery */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#cbd5e1' }}>
                                <strong>Image Gallery URLs</strong>
                                <button type="button" onClick={() => addArrayItem(setImages)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><FiPlus/> Add Image</button>
                            </label>
                            {images.map((img, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input type="url" value={img} onChange={e => handleArrayChange(setImages, idx, e.target.value)} placeholder="https://..." style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                                    {images.length > 1 && <button type="button" onClick={() => removeArrayItem(setImages, idx)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FiTrash/></button>}
                                </div>
                            ))}
                        </div>

                        {/* Features List */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#cbd5e1' }}>
                                <strong>Bullet Point Features</strong>
                                <button type="button" onClick={() => addArrayItem(setFeatures)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><FiPlus/> Add Feature</button>
                            </label>
                            {features.map((feat, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input type="text" value={feat} onChange={e => handleArrayChange(setFeatures, idx, e.target.value)} placeholder="e.g. 100% Premium Cotton" style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                                    {features.length > 1 && <button type="button" onClick={() => removeArrayItem(setFeatures, idx)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FiTrash/></button>}
                                </div>
                            ))}
                        </div>

                        {/* Custom Fields (Versatile Details) */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#cbd5e1' }}>
                                <strong>Custom Specifics (Versatile Fields)</strong>
                                <button type="button" onClick={() => addArrayItem(setCustomFields, {label:'', value:''})} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><FiPlus/> Add Custom Field</button>
                            </label>
                            {customFields.length === 0 && <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Add custom details like Color, Size, Material, Weight, etc.</p>}
                            {customFields.map((field, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input type="text" value={field.label} onChange={e => { const n = [...customFields]; n[idx].label = e.target.value; setCustomFields(n); }} placeholder="Label (e.g. Color)" style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                                    <input type="text" value={field.value} onChange={e => { const n = [...customFields]; n[idx].value = e.target.value; setCustomFields(n); }} placeholder="Value (e.g. Midnight Blue)" style={{ flex: 2, padding: '0.5rem', borderRadius: '0.25rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                                    <button type="button" onClick={() => removeArrayItem(setCustomFields, idx)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FiTrash/></button>
                                </div>
                            ))}
                        </div>

                        {/* Payment & Status */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Payment Service</label>
                                <select value={paymentService} onChange={e => setPaymentService(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }}>
                                    <option value="razorpay">Razorpay Checkout (Automated)</option>
                                    <option value="custom_link">Custom Payment Link</option>
                                </select>
                            </div>
                            {paymentService === 'custom_link' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Custom Payment URL</label>
                                    <input type="url" value={paymentLink} onChange={e => setPaymentLink(e.target.value)} placeholder="https://rzp.io/l/..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem' }} />
                            <label htmlFor="isActive" style={{ color: '#cbd5e1', cursor: 'pointer', fontWeight: 600 }}>Active (Visible on public site)</label>
                        </div>

                        <button type="submit" className="dash-btn dash-btn-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem', padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            {editingId ? 'Save Changes' : 'Create Product'}
                        </button>
                    </form>
                </div>
            )}

            {/* Product List */}
            {loading ? (
                <p>Loading products...</p>
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8' }}>
                    <FiPackage style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No products found. Add your first product above.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {products.map(prod => (
                        <div key={prod.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                            {prod.images && prod.images[0] ? (
                                <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                                    <img src={prod.images[0]} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    {prod.images.length > 1 && (
                                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            <FiImage style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {prod.images.length}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ height: '180px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiImage style={{ fontSize: '2rem', color: '#475569' }} />
                                </div>
                            )}
                            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>{prod.name}</h4>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', background: prod.is_active ? 'rgba(34,216,122,0.1)' : 'rgba(239,68,68,0.1)', color: prod.is_active ? '#22d87a' : '#ef4444' }}>
                                        {prod.is_active ? 'Live' : 'Hidden'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', background: prod.stock_status === 'in_stock' ? 'rgba(56,189,248,0.1)' : 'rgba(245,158,11,0.1)', color: prod.stock_status === 'in_stock' ? '#38bdf8' : '#f59e0b' }}>
                                        {prod.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                                        {prod.payment_service === 'razorpay' ? 'RZP Native' : 'Custom Link'}
                                    </span>
                                </div>
                                
                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        {prod.compare_at_price && (
                                            <div style={{ textDecoration: 'line-through', color: '#64748b', fontSize: '0.9rem' }}>₹{prod.compare_at_price}</div>
                                        )}
                                        <div style={{ color: '#38bdf8', fontSize: '1.25rem', fontWeight: 'bold' }}>₹{prod.price}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(prod)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="Edit"><FiEdit /></button>
                                        <button onClick={() => handleDelete(prod.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }} title="Delete"><FiTrash /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// --- REVIEWS MANAGER ---
function ReviewsManager({ supabase }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchReviews(); }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('merchandise_reviews')
                .select(`*, merchandise_products (name)`)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setReviews(data || []);
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to load reviews', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleApproval = async (review) => {
        try {
            const { error } = await supabase.from('merchandise_reviews').update({ is_approved: !review.is_approved }).eq('id', review.id);
            if (error) throw error;
            fetchReviews();
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Could not update review', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({ title: 'Delete review?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' });
        if (result.isConfirmed) {
            try {
                const { error } = await supabase.from('merchandise_reviews').delete().eq('id', id);
                if (error) throw error;
                fetchReviews();
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'Failed to delete review', 'error');
            }
        }
    };

    if (loading) return <p>Loading reviews...</p>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8' }}>
                    <FiMessageSquare style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No user reviews yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reviews.map(rev => (
                        <div key={rev.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <strong style={{ color: 'white', fontSize: '1.1rem' }}>{rev.user_name}</strong>
                                    <span style={{ color: '#fbbf24' }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>For: {rev.merchandise_products?.name || 'Deleted Product'}</span>
                                </div>
                                <p style={{ color: '#cbd5e1', margin: '0 0 1rem 0' }}>{rev.comment}</p>
                                <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', background: rev.is_approved ? 'rgba(34,216,122,0.1)' : 'rgba(245,158,11,0.1)', color: rev.is_approved ? '#22d87a' : '#f59e0b' }}>
                                    {rev.is_approved ? 'Approved (Visible)' : 'Hidden (Pending)'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleToggleApproval(rev)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                    {rev.is_approved ? 'Hide' : 'Approve'}
                                </button>
                                <button onClick={() => handleDelete(rev.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                    <FiTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
