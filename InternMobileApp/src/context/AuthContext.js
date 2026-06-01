import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
  }, []);

  const fetchProfile = async (user) => {
    try {
      // 1. Fetch Application data (to check if they applied and are approved)
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('email', user.email)
        .single();
      
      // 2. Fetch Profile data (to check if they created an account and paid)
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setProfile({
        application: appData || null,
        userProfile: userProfile || null,
      });
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
