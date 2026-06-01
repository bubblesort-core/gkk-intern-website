import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const MaintenanceGuard = ({ children }) => {
  const [maintenance, setMaintenance] = useState({ loading: true, enabled: false, title: '', message: '' });

  useEffect(() => {
    const checkMaintenance = async () => {
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
          setMaintenance({ loading: false, enabled: false });
        } else if (data && data.value) {
          setMaintenance({
            loading: false,
            enabled: data.value.enabled,
            title: data.value.title || 'Scheduled Maintenance',
            message: data.value.message || 'We are currently undergoing scheduled maintenance. Please check back soon.'
          });
        }
      } catch (err) {
        console.error('Failed to fetch maintenance status:', err);
        setMaintenance({ loading: false, enabled: false });
      }
    };

    checkMaintenance();
  }, []);

  if (maintenance.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (maintenance.enabled) {
    return (
      <View style={styles.container}>
        <Ionicons name="construct" size={64} color={colors.primary} style={styles.icon} />
        <Text style={styles.title}>{maintenance.title}</Text>
        <Text style={styles.message}>{maintenance.message}</Text>
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default MaintenanceGuard;
