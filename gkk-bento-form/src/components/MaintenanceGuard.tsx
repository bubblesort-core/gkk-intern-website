import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MaintenanceState {
  loading: boolean;
  enabled: boolean;
  target: string;
  title: string;
  message: string;
}

const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
  const [maintenance, setMaintenance] = useState<MaintenanceState>({ loading: true, enabled: false, target: 'all', title: '', message: '' });

  useEffect(() => {
    const checkMaintenance = async () => {
      // Check for bypass token in URL
      const params = new URLSearchParams(window.location.search);
      if (params.get('bypass') === 'admin') {
        localStorage.setItem('maintenance_bypass', 'true');
      } else if (params.get('bypass') === 'off') {
        localStorage.removeItem('maintenance_bypass');
      }

      // If bypassed, skip the database check entirely
      if (localStorage.getItem('maintenance_bypass') === 'true') {
        setMaintenance({ loading: false, enabled: false, target: 'all', title: '', message: '' });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('system_config')
          .select('value')
          .eq('key', 'maintenance_mode')
          .maybeSingle();

        if (error) {
          if (error.code !== 'PGRST116') {
             console.error('Error checking maintenance state:', error);
          }
          setMaintenance({ loading: false, enabled: false, target: 'all', title: '', message: '' });
        } else if (data && data.value) {
          setMaintenance({
            loading: false,
            enabled: data.value.enabled === true || data.value.enabled === 'true',
            target: data.value.target || 'all',
            title: data.value.title || 'Scheduled Maintenance',
            message: data.value.message || 'We are currently undergoing scheduled maintenance. Please check back soon.'
          });
        } else {
          setMaintenance({ loading: false, enabled: false, target: 'all', title: '', message: '' });
        }
      } catch (err) {
        console.error('Failed to fetch maintenance status:', err);
        setMaintenance({ loading: false, enabled: false, target: 'all', title: '', message: '' });
      }
    };

    checkMaintenance();
  }, []);

  if (maintenance.loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ color: '#3b82f6', fontSize: '24px' }}><i className="fas fa-spinner fa-spin"></i></div>
      </div>
    );
  }

  let shouldBlock = false;
  if (maintenance.enabled) {
    if (maintenance.target === 'all' || maintenance.target === 'apply') {
      shouldBlock = true;
    }
  }

  if (shouldBlock) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999, background: '#0f172a', color: 'white',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', textAlign: 'center', fontFamily: '"Inter", sans-serif'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '3rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '600px', width: '100%' }}>
          <i className="fas fa-tools" style={{ fontSize: '4rem', color: '#3b82f6', marginBottom: '1.5rem' }}></i>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc' }}>
            {maintenance.title}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.6 }}>
            {maintenance.message}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MaintenanceGuard;
