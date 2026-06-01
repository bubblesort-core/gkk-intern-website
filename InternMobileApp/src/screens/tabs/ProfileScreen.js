import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

export default function ProfileScreen() {
    const { profile } = useAuth();
    const { currentTeam } = useDashboard();
    const currentUser = profile?.userProfile;

    const [linkedIn, setLinkedIn] = useState(currentUser?.social_links?.linkedin || '');
    const [bio, setBio] = useState(currentUser?.bio || '');
    const [saving, setSaving] = useState(false);

    const name = currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Intern';
    const initial = name[0]?.toUpperCase() || 'I';
    const isPaid = currentUser?.status === 'active';
    const streak = currentUser?.current_streak || 0;
    
    const calculateLevel = (s) => {
        if (s >= 30) return 'Expert';
        if (s >= 14) return 'Advanced';
        if (s >= 7) return 'Intermediate';
        return 'Beginner';
    };
    
    const level = calculateLevel(streak);
    const title = currentUser?.title || 'Intern';
    const phone = currentUser?.phone || 'Not set';
    const batchName = currentTeam?.batches?.name || 'Not assigned';

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = {
                bio,
                social_links: { ...currentUser?.social_links, linkedin: linkedIn }
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', currentUser.id);

            if (error) throw error;
            Alert.alert('Success', 'Profile updated successfully.');
        } catch (err) {
            console.error('Error saving profile:', err);
            Alert.alert('Error', 'Could not update profile.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={{ padding: 20 }}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {currentUser?.avatar_url ? (
                            <Image source={{ uri: currentUser.avatar_url }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{initial}</Text>
                        )}
                    </View>
                    <Text style={styles.nameText}>{name}</Text>
                    <Text style={styles.titleText}>{title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: isPaid ? '#d1fae5' : '#fef3c7' }]}>
                        <Ionicons name={isPaid ? "checkmark-circle" : "time"} size={14} color={isPaid ? '#065f46' : '#92400e'} style={{ marginRight: 4 }} />
                        <Text style={[styles.statusBadgeText, { color: isPaid ? '#065f46' : '#92400e' }]}>{isPaid ? 'Active Intern' : 'Pending Payment'}</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="flame" size={24} color="#f97316" style={{ marginRight: 6 }} />
                            <Text style={[styles.statValue, { color: '#f97316' }]}>{streak}</Text>
                        </View>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{level}</Text>
                        <Text style={styles.statLabel}>Level</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="layers" size={20} color="#3b82f6" style={{ marginRight: 6 }} />
                            <Text style={[styles.statValue, { color: '#3b82f6', fontSize: 18 }]}>
                                {batchName === 'Not assigned' ? 'None' : batchName.replace('BATCH ', '')}
                            </Text>
                        </View>
                        <Text style={styles.statLabel}>Batch</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name={isPaid ? "checkmark-circle" : "alert-circle"} size={28} color={isPaid ? '#10b981' : '#f59e0b'} />
                        <Text style={styles.statLabel}>{isPaid ? 'Paid' : 'Pending'}</Text>
                    </View>
                </View>

                {/* Edit Form */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                        <Ionicons name="person-circle" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                    </View>

                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={[styles.input, styles.disabledInput]} value={name} editable={false} />

                    <Text style={styles.label}>Email</Text>
                    <TextInput style={[styles.input, styles.disabledInput]} value={currentUser?.email} editable={false} />

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput style={[styles.input, styles.disabledInput]} value={phone} editable={false} />

                    <Text style={styles.label}>LinkedIn Profile</Text>
                    <TextInput 
                        style={styles.input} 
                        value={linkedIn} 
                        onChangeText={setLinkedIn} 
                        placeholder="https://linkedin.com/in/..." 
                        placeholderTextColor="#475569"
                    />

                    <Text style={styles.label}>Bio</Text>
                    <TextInput 
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                        value={bio} 
                        onChangeText={setBio} 
                        placeholder="Tell us about yourself..." 
                        placeholderTextColor="#475569"
                        multiline
                    />

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                        {saving ? (
                            <ActivityIndicator size="small" color={colors.background} />
                        ) : (
                            <>
                                <Ionicons name="save" size={18} color={colors.background} style={{ marginRight: 8 }} />
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: '#1f1f2e',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    body: {
        flex: 1,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 25,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(34, 216, 122, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: colors.primary,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.primary,
    },
    nameText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    titleText: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#1f1f2e',
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#94a3b8',
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#1f1f2e',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    label: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 12,
        color: colors.text,
        fontSize: 15,
    },
    disabledInput: {
        opacity: 0.6,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    saveButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        marginTop: 25,
    },
    saveButtonText: {
        color: colors.background,
        fontWeight: 'bold',
        fontSize: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        marginBottom: 40,
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
