import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { supabase } from '../../lib/supabase';

export default function HomeScreen({ navigation }) {
  const { profile } = useAuth();
  const { currentTeam, currentProjects, workshops, loadingDashboard } = useDashboard();
  
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  useEffect(() => {
    if (loadingDashboard || !profile?.userProfile?.id) return;

    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase.rpc('get_targeted_announcements', {
          p_user_id: profile.userProfile.id,
          p_team_id: currentTeam?.id || null,
          p_batch: currentTeam?.batch_id || null
        });
        if (error) throw error;
        setAnnouncements(data || []);
      } catch (err) {
        console.error('Error loading announcements:', err);
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    fetchAnnouncements();
  }, [loadingDashboard, currentTeam, profile]);

  const userName = profile?.userProfile?.full_name || profile?.application?.full_name || 'Intern';
  const firstName = userName.split(' ')[0];
  const role = currentTeam?.myRole || 'Intern';
  const streak = profile?.userProfile?.current_streak || 0;
  const projectCount = currentProjects?.length || 0;
  const workshopCount = workshops?.length || 0;
  const memberCount = currentTeam?.team_members?.length || 0;

  if (loadingDashboard) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Section */}
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Welcome back, {firstName}</Text>
        <Text style={styles.heroSubtitle}>You're doing great. Keep momentum by staying aligned with your projects and team.</Text>
        <View style={styles.tagsContainer}>
          <View style={styles.tag}><Text style={styles.tagText}>{role.toUpperCase()}</Text></View>
          {currentTeam?.name && <View style={[styles.tag, { backgroundColor: 'rgba(59,130,246,0.1)' }]}><Text style={[styles.tagText, { color: '#3b82f6' }]}>{currentTeam.name}</Text></View>}
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
          <Ionicons name="briefcase" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{projectCount}</Text>
          <Text style={styles.statLabel}>Active Projects</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#a855f7' }]}>
          <Ionicons name="videocam" size={24} color="#a855f7" />
          <Text style={styles.statValue}>{workshopCount}</Text>
          <Text style={styles.statLabel}>Live Workshops</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
          <Ionicons name="people" size={24} color="#10b981" />
          <Text style={styles.statValue}>{memberCount}</Text>
          <Text style={styles.statLabel}>Team Members</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
          <Ionicons name="flame" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Announcements */}
      <Text style={styles.sectionTitle}>Announcements</Text>
      {loadingAnnouncements ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
      ) : announcements.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="megaphone-outline" size={32} color="#666" />
          <Text style={styles.emptyText}>No Announcements</Text>
          <Text style={styles.emptySubText}>You're all caught up!</Text>
        </View>
      ) : (
        announcements.map((a) => (
          <View key={a.id} style={styles.announcementCard}>
            <View style={styles.aHeader}>
              <View style={styles.aIconWrap}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
              </View>
              <View style={styles.aTitleWrap}>
                <Text style={styles.aTitle}>{a.title}</Text>
              </View>
            </View>
            <Text style={styles.aContent}>{a.content || a.message}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  
  heroCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1f1f2e'
  },
  heroTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  heroSubtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  tagsContainer: { flexDirection: 'row', gap: 10 },
  tag: { backgroundColor: 'rgba(34, 216, 122, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { color: colors.primary, fontSize: 12, fontWeight: 'bold' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#1f1f2e'
  },
  statValue: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  statLabel: { color: '#94a3b8', fontSize: 12 },

  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  
  announcementCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f1f2e'
  },
  aHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aIconWrap: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(34, 216, 122, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  aTitleWrap: { flex: 1 },
  aTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  aContent: { color: '#94a3b8', fontSize: 14, lineHeight: 22 },

  emptyCard: { backgroundColor: colors.surface, padding: 30, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1f1f2e' },
  emptyText: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubText: { color: '#94a3b8', fontSize: 14, marginTop: 4 }
});
