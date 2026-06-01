import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  const { profile } = useAuth(); // contains { application, userProfile }
  
  const [currentTeam, setCurrentTeam] = useState(null);
  const [currentProjects, setCurrentProjects] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      if (!profile?.userProfile?.id) {
        setLoadingDashboard(false);
        return;
      }

      setLoadingDashboard(true);
      try {
        const userId = profile.userProfile.id;

        // 1. Load Team and Projects
        const { data: membership } = await supabase
            .from('team_members')
            .select('team_id, role, teams(id, name, description, is_active, batch_id, created_at, batches(name), projects(id, title, status))')
            .eq('user_id', userId)
            .maybeSingle();

        if (membership?.teams) {
            const team = membership.teams;
            // Get team members
            const { data: members } = await supabase
                .from('team_members')
                .select('id, user_id, role, profiles(id, full_name, email, avatar_url, github_url, linkedin_url)')
                .eq('team_id', team.id);
                
            team.team_members = members || [];
            team.myRole = membership.role;
            if (mounted) setCurrentTeam(team);
            
            // Get projects independently to include submissions
            const { data: projectsData } = await supabase
                .from('projects')
                .select('*, project_submissions(*)')
                .eq('assigned_team_id', team.id)
                .order('created_at', { ascending: false });
                
            if (mounted) setCurrentProjects(projectsData || []);
        }

        // 2. Load Active Workshops
        const { data: workshopData } = await supabase
            .from('workshops')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
            
        if (mounted) setWorkshops(workshopData || []);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (mounted) setLoadingDashboard(false);
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
    };
  }, [profile]);

  return (
    <DashboardContext.Provider value={{
      currentTeam,
      currentProjects,
      workshops,
      loadingDashboard
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
