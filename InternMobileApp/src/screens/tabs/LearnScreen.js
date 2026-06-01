import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

export default function LearnScreen() {
    const { currentTeam, workshops } = useDashboard();
    const { profile } = useAuth();
    const currentUser = profile?.userProfile;

    const [activeTab, setActiveTab] = useState('meetings');
    const [loadingData, setLoadingData] = useState(false);

    // States
    const [activeMeetings, setActiveMeetings] = useState([]);
    const [scheduledMeetings, setScheduledMeetings] = useState([]);
    const [recordings, setRecordings] = useState([]);
    const [resources, setResources] = useState([]);

    const isEligible = useCallback((m) => {
        if (!m) return false;
        if (!m.target_type || m.target_type === 'all') return true;
        const tIds = m.target_ids || [];
        const myTeamId = currentTeam?.id;
        const myBatchId = currentTeam?.batch_id || currentTeam?.batches?.id;
        
        if (m.target_type === 'team') return myTeamId && tIds.includes(myTeamId);
        if (m.target_type === 'batch') return myBatchId && tIds.includes(myBatchId);
        if (m.target_type === 'intern') return currentUser?.id && tIds.includes(currentUser.id);
        
        return false;
    }, [currentTeam, currentUser]);

    const loadMeetings = useCallback(async () => {
        setLoadingData(true);
        try {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .order('scheduled_start', { ascending: false })
                .limit(50);
                
            if (!error && data) {
                const visible = data.filter(isEligible);
                setActiveMeetings(visible.filter(s => s.status === 'live'));
                setScheduledMeetings(visible.filter(s => s.status === 'scheduled' && new Date(s.scheduled_start) > new Date()));
            }
        } catch (err) {
            console.error('Error loading meetings:', err);
        } finally {
            setLoadingData(false);
        }
    }, [isEligible]);

    const loadRecordings = useCallback(async () => {
        setLoadingData(true);
        try {
            const { data, error } = await supabase
                .from('recordings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
                
            if (!error && data) {
                const visible = data.filter(isEligible);
                setRecordings(visible);
            }
        } catch (err) {
            console.error('Error loading recordings:', err);
        } finally {
            setLoadingData(false);
        }
    }, [isEligible]);

    const loadResources = useCallback(async () => {
        if (!currentUser) return;
        setLoadingData(true);
        try {
            const { data, error } = await supabase.rpc('get_targeted_resources', {
                p_user_id: currentUser.id,
                p_team_id: currentTeam?.id || null,
                p_batch: currentTeam?.batch_id || null
            });
            if (!error && data) {
                setResources(data);
            }
        } catch (err) {
            console.error('Error loading resources:', err);
        } finally {
            setLoadingData(false);
        }
    }, [currentUser, currentTeam]);

    useEffect(() => {
        if (activeTab === 'meetings') loadMeetings();
        else if (activeTab === 'recordings') loadRecordings();
        else if (activeTab === 'resources') loadResources();
    }, [activeTab, loadMeetings, loadRecordings, loadResources]);

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                {[
                    { id: 'meetings', label: 'Meetings', icon: 'videocam' },
                    { id: 'workshops', label: 'Workshops', icon: 'school' },
                    { id: 'recordings', label: 'Recordings', icon: 'play-circle' },
                    { id: 'resources', label: 'Resources', icon: 'library' },
                ].map(tab => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
                        onPress={() => setActiveTab(tab.id)}
                    >
                        <Ionicons name={tab.icon} size={16} color={activeTab === tab.id ? colors.primary : '#94a3b8'} style={{ marginRight: 6 }} />
                        <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderMeetings = () => {
        if (loadingData) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />;
        
        const hasLive = activeMeetings.length > 0;
        const hasUpcoming = scheduledMeetings.length > 0;

        if (!hasLive && !hasUpcoming) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="videocam-outline" size={48} color="#334155" />
                    <Text style={styles.emptyStateTitle}>No Meetings</Text>
                    <Text style={styles.emptyStateDesc}>There are no live or upcoming sessions right now.</Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                {hasLive && <Text style={styles.sectionHeader}>Live Now</Text>}
                {activeMeetings.map(m => (
                    <View key={m.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#ef4444' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                            </View>
                            <Text style={styles.platformText}>via {m.platform === 'google_meet' ? 'Google Meet' : 'YouTube Live'}</Text>
                        </View>
                        <Text style={styles.cardTitle}>{m.title}</Text>
                        <Text style={styles.cardDesc}>Started at {new Date(m.actual_start || m.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        
                        <TouchableOpacity 
                            style={styles.primaryButton}
                            onPress={() => m.join_url ? Linking.openURL(m.join_url) : null}
                        >
                            <Text style={styles.primaryButtonText}>Join Meeting</Text>
                            <Ionicons name="open-outline" size={16} color={colors.background} style={{ marginLeft: 5 }} />
                        </TouchableOpacity>
                    </View>
                ))}

                {hasUpcoming && <Text style={[styles.sectionHeader, { marginTop: hasLive ? 20 : 0 }]}>Upcoming Sessions</Text>}
                {scheduledMeetings.map(m => (
                    <View key={m.id} style={styles.card}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <Ionicons name="time-outline" size={16} color={colors.primary} />
                            <Text style={styles.dateText}>
                                {new Date(m.scheduled_start).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <Text style={styles.cardTitle}>{m.title}</Text>
                        <View style={styles.platformBadge}>
                            <Text style={styles.platformBadgeText}>{m.platform === 'google_meet' ? 'Google Meet' : 'YouTube Live'}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderWorkshops = () => {
        if (workshops.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="school-outline" size={48} color="#334155" />
                    <Text style={styles.emptyStateTitle}>No Active Workshops</Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                {workshops.map(w => (
                    <View key={w.id} style={styles.card}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text style={[styles.cardTitle, { flex: 1 }]}>{w.title}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                                <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '600' }}>Active</Text>
                            </View>
                        </View>
                        <Text style={styles.cardDesc} numberOfLines={3}>{w.description}</Text>
                        
                        {w.instructor_name && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                <Ionicons name="person" size={14} color={colors.primary} />
                                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                                    {w.instructor_name}
                                </Text>
                            </View>
                        )}
                        {(w.session_date || w.session_time) && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 15 }}>
                                <Ionicons name="time" size={14} color="#94a3b8" />
                                <Text style={{ color: '#94a3b8', fontSize: 13, marginLeft: 6 }}>
                                    {w.session_date} {w.session_time && `@ ${w.session_time}`}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity 
                            style={styles.primaryButton}
                            onPress={() => w.cta_link ? Linking.openURL(w.cta_link) : null}
                        >
                            <Text style={styles.primaryButtonText}>{w.cta_text || 'Learn More'}</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderRecordings = () => {
        if (loadingData) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />;
        
        if (recordings.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="play-circle-outline" size={48} color="#334155" />
                    <Text style={styles.emptyStateTitle}>No Recordings Available</Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                {recordings.map(r => (
                    <TouchableOpacity 
                        key={r.id} 
                        style={styles.card}
                        onPress={() => {
                            const url = r.youtube_url || (r.youtube_video_id ? `https://youtube.com/watch?v=${r.youtube_video_id}` : null);
                            if (url) Linking.openURL(url);
                        }}
                    >
                        <Text style={styles.cardTitle}>{r.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                            <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                            <Text style={{ color: '#94a3b8', fontSize: 13, marginLeft: 6 }}>
                                {new Date(r.created_at).toLocaleDateString()}
                            </Text>
                            <View style={{ flex: 1 }} />
                            <Ionicons name="play-circle" size={16} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600', marginLeft: 4 }}>
                                Watch Now
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    const renderResources = () => {
        if (loadingData) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />;
        
        if (resources.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="book-outline" size={48} color="#334155" />
                    <Text style={styles.emptyStateTitle}>No Resources Found</Text>
                </View>
            );
        }

        const typeStyles = {
            pdf: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', icon: 'document-text' },
            doc: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', icon: 'document' },
            video: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', icon: 'play-circle' },
            link: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', icon: 'link' }
        };

        return (
            <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                {resources.map(res => {
                    const ts = typeStyles[res.type] || typeStyles.link;
                    const isDownload = res.type === 'pdf' || res.type === 'doc';
                    
                    return (
                        <TouchableOpacity 
                            key={res.id} 
                            style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}
                            onPress={() => res.url ? Linking.openURL(res.url) : null}
                        >
                            <View style={[styles.resourceIconContainer, { backgroundColor: ts.bg }]}>
                                <Ionicons name={ts.icon} size={24} color={ts.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.resourceCategory}>{res.category || res.type}</Text>
                                <Text style={styles.cardTitle}>{res.title}</Text>
                                {res.description && (
                                    <Text style={styles.cardDesc} numberOfLines={2}>{res.description}</Text>
                                )}
                            </View>
                            <Ionicons name={isDownload ? 'download-outline' : 'open-outline'} size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Learn</Text>
            </View>

            {renderTabs()}

            <View style={styles.body}>
                {activeTab === 'meetings' && renderMeetings()}
                {activeTab === 'workshops' && renderWorkshops()}
                {activeTab === 'recordings' && renderRecordings()}
                {activeTab === 'resources' && renderResources()}
            </View>
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
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    tabsContainer: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: '#1f1f2e',
    },
    tabsScroll: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginHorizontal: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    activeTabButton: {
        backgroundColor: 'rgba(34, 216, 122, 0.1)',
    },
    tabText: {
        color: '#94a3b8',
        fontWeight: '600',
        fontSize: 14,
    },
    activeTabText: {
        color: colors.primary,
    },
    body: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    sectionHeader: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1f1f2e',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 20,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 15,
    },
    primaryButtonText: {
        color: colors.background,
        fontWeight: 'bold',
        fontSize: 15,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 15,
        marginBottom: 8,
    },
    emptyStateDesc: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239,68,68,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ef4444',
        marginRight: 6,
    },
    liveBadgeText: {
        color: '#ef4444',
        fontSize: 11,
        fontWeight: 'bold',
    },
    platformText: {
        color: '#94a3b8',
        fontSize: 12,
        marginLeft: 10,
    },
    dateText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    platformBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 10,
    },
    platformBadgeText: {
        color: '#94a3b8',
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    resourceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    resourceCategory: {
        color: '#94a3b8',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
});
