import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
  const { profile } = useAuth();
  
  const userName = profile?.userProfile?.full_name || profile?.application?.full_name || 'Intern';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back, {userName.split(' ')[0]}!</Text>
      <Text style={styles.subtitle}>Your mobile dashboard is ready.</Text>
      
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Projects</Text>
          <Text style={styles.cardValue}>0 Active</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meetings</Text>
          <Text style={styles.cardValue}>No upcoming</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  cardValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 'auto',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: 'bold',
  }
});
