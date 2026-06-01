import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

export default function ProjectsScreen() {
    const { currentTeam, currentProjects } = useDashboard();
    const { profile } = useAuth();
    const currentUser = profile?.userProfile;

    const [activeTab, setActiveTab] = useState('team');
    
    // States for data
    const [customProjects, setCustomProjects] = useState([]);
    const [reportLinks, setReportLinks] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // States for custom project modal
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [cpTitle, setCpTitle] = useState('');
    const [cpDesc, setCpDesc] = useState('');
    const [cpLiveUrl, setCpLiveUrl] = useState('');
    const [cpGithubUrl, setCpGithubUrl] = useState('');
    const [submittingCustom, setSubmittingCustom] = useState(false);

    // States for team project modal
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [modalProjectId, setModalProjectId] = useState(null);
    const [modalProjectTitle, setModalProjectTitle] = useState('');
    const [modalLiveUrl, setModalLiveUrl] = useState('');
    const [modalGithubUrl, setModalGithubUrl] = useState('');
    const [modalNotes, setModalNotes] = useState('');
    const [submittingTeam, setSubmittingTeam] = useState(false);

    const loadCustomProjects = useCallback(async () => {
        if (!currentUser) return;
        setLoadingData(true);
        try {
            const { data, error } = await supabase
                .from('custom_project_submissions')
                .select('*')
                .eq('intern_id', currentUser.id)
                .order('created_at', { ascending: false });
            if (!error && data) setCustomProjects(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingData(false);
        }
    }, [currentUser]);

    const loadReportLinks = useCallback(async () => {
        if (!currentUser) return;
        setLoadingData(true);
        try {
            const { data, error } = await supabase
                .from('report_submission_links')
                .select('*')
                .eq('is_enabled', true)
                .order('created_at', { ascending: false });
            if (!error && data) setReportLinks(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingData(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (activeTab === 'custom') loadCustomProjects();
        if (activeTab === 'reports') loadReportLinks();
    }, [activeTab, loadCustomProjects, loadReportLinks]);

    const getStatusInfo = (project) => {
        const sub = project.project_submissions?.[0];
        let statusColor = '#94a3b8', statusText = 'Assigned';
        let bg = 'rgba(148, 163, 184, 0.1)';

        if (project.status === 'approved' || project.status === 'completed') {
            statusColor = '#10b981'; statusText = 'Completed'; bg = 'rgba(16, 185, 129, 0.1)';
        } else if (project.status === 'rejected') {
            statusColor = '#ef4444'; statusText = 'Rejected'; bg = 'rgba(239, 68, 68, 0.1)';
        } else if (project.status === 'changes_requested') {
            statusColor = '#f59e0b'; statusText = 'Changes Requested'; bg = 'rgba(245, 158, 11, 0.1)';
        } else if (project.status === 'under_review') {
            statusColor = '#3b82f6'; statusText = 'Under Review'; bg = 'rgba(59, 130, 246, 0.1)';
        } else if (project.status === 'in_progress') {
            statusColor = '#3b82f6'; statusText = 'In Progress'; bg = 'rgba(59, 130, 246, 0.1)';
        } else if (sub) {
            if (sub.status === 'approved') { statusColor = '#10b981'; statusText = 'Completed'; bg = 'rgba(16, 185, 129, 0.1)'; }
            else if (sub.status === 'rejected') {
                statusColor = '#ef4444'; statusText = 'Rejected'; bg = 'rgba(239, 68, 68, 0.1)';
            } else if (sub.status === 'changes_requested') {
                statusColor = '#f59e0b'; statusText = 'Changes Requested'; bg = 'rgba(245, 158, 11, 0.1)';
            } else { statusColor = '#3b82f6'; statusText = 'Submitted (Review Pending)'; bg = 'rgba(59, 130, 246, 0.1)'; }
        }

        return { statusColor, statusText, bg, sub };
    };

    const handleTeamSubmit = async () => {
        if (!currentTeam || submittingTeam || !modalProjectId) return;
        setSubmittingTeam(true);

        try {
            const { error: subError } = await supabase
                .from('project_submissions')
                .upsert({
                    team_id: currentTeam.id,
                    project_id: modalProjectId,
                    github_url: modalGithubUrl,
                    live_url: modalLiveUrl,
                    notes: modalNotes,
                    submitted_by: currentUser.id,
                    submitted_at: new Date().toISOString()
                }, { onConflict: 'project_id,team_id' });
            if (subError) throw subError;

            await supabase.from('projects').update({ status: 'submitted' }).eq('id', modalProjectId);
            Alert.alert('Success', 'Project Submitted!');
            setShowTeamModal(false);
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setSubmittingTeam(false);
        }
    };

    const submitCustomProject = async () => {
        if (submittingCustom) return;
        if (!cpTitle.trim() || !cpDesc.trim() || !cpLiveUrl.trim()) {
            Alert.alert('Error', 'Please fill in Title, Description, and Live URL.');
            return;
        }
        setSubmittingCustom(true);
        try {
            let deployedUrl = cpLiveUrl.trim();
            if (deployedUrl && !deployedUrl.startsWith('http')) deployedUrl = 'https://' + deployedUrl;

            let githubUrl = cpGithubUrl.trim();
            if (githubUrl && !githubUrl.startsWith('http')) githubUrl = 'https://' + githubUrl;

            const { error } = await supabase.from('custom_project_submissions').insert({
                intern_id: currentUser.id,
                title: cpTitle.trim(),
                description: cpDesc.trim(),
                deployed_url: deployedUrl,
                github_url: githubUrl || null,
                status: 'submitted'
            });

            if (error) throw error;
            Alert.alert('Success', 'Project Submitted! Your project is under review.');
            setShowCustomModal(false);
            setCpTitle(''); setCpDesc(''); setCpLiveUrl(''); setCpGithubUrl('');
            loadCustomProjects();
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setSubmittingCustom(false);
        }
    };

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                {[
                    { id: 'team', label: 'Team Projects', icon: 'briefcase' },
                    { id: 'custom', label: 'Custom', icon: 'rocket' },
                    { id: 'reports', label: 'Reports', icon: 'document-text' },
                    { id: 'members', label: 'Team', icon: 'people' },
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

    const renderTeamProjects = () => {
        if (!currentTeam) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="people" size={48} color="#334155" />
                    <Text style={styles.emptyStateTitle}>No Team Assigned</Text>
                    <Text style={styles.emptyStateDesc}>You haven't been assigned to a team yet.</Text>
                </View>
            );
        }
        if (currentProjects.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="folder-open" size={48} color="#334155" />
                    <Text style={styles.emptyStateTitle}>No Projects</Text>
                    <Text style={styles.emptyStateDesc}>No projects assigned yet.</Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                {currentProjects.map(project => {
                    const { statusColor, statusText, bg, sub } = getStatusInfo(project);
                    return (
                        <View key={project.id} style={styles.card}>
                            <View style={[styles.statusBadge, { backgroundColor: bg }]}>
                                <Text style={{ color: statusColor, fontSize: 12, fontWeight: '600' }}>{statusText}</Text>
                            </View>
                            <Text style={styles.cardTitle}>{project.title}</Text>
                            {project.description && (
                                <Text style={styles.cardDesc} numberOfLines={3}>{project.description}</Text>
                            )}
                            
                            {sub?.feedback && (
                                <View style={styles.feedbackBox}>
                                    <Text style={styles.feedbackTitle}>Admin Feedback</Text>
                                    <Text style={styles.feedbackText}>{sub.feedback}</Text>
                                </View>
                            )}

                            <TouchableOpacity 
                                style={styles.primaryButton}
                                onPress={() => {
                                    setModalProjectId(project.id);
                                    setModalProjectTitle(project.title);
                                    setModalLiveUrl(sub?.live_url || '');
                                    setModalGithubUrl(sub?.github_url || '');
                                    setModalNotes(sub?.notes || '');
                                    setShowTeamModal(true);
                                }}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {sub ? 'Update Submission' : 'Submit Project'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </ScrollView>
        );
    };

    const renderCustomProjects = () => {
        return (
            <View style={{ flex: 1 }}>
                <View style={styles.actionHeader}>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => setShowCustomModal(true)}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.primaryButtonText}>Submit New Custom Project</Text>
                    </TouchableOpacity>
                </View>
                {loadingData ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : customProjects.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="rocket-outline" size={48} color="#334155" />
                        <Text style={styles.emptyStateTitle}>No Custom Projects</Text>
                        <Text style={styles.emptyStateDesc}>You haven't submitted any custom projects yet.</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                        {customProjects.map(cp => {
                            let sColor = '#94a3b8'; let sText = 'Pending';
                            if(cp.status === 'approved') { sColor = '#10b981'; sText = 'Approved'; }
                            if(cp.status === 'rejected') { sColor = '#ef4444'; sText = 'Rejected'; }
                            if(cp.status === 'reviewed') { sColor = '#f59e0b'; sText = 'Reviewed'; }

                            return (
                                <View key={cp.id} style={styles.card}>
                                    <View style={[styles.statusBadge, { backgroundColor: `${sColor}20` }]}>
                                        <Text style={{ color: sColor, fontSize: 12, fontWeight: '600' }}>{sText}</Text>
                                    </View>
                                    <Text style={styles.cardTitle}>{cp.title}</Text>
                                    <Text style={styles.cardDesc}>{cp.description}</Text>
                                    {cp.feedback && (
                                        <View style={styles.feedbackBox}>
                                            <Text style={styles.feedbackTitle}>Admin Feedback</Text>
                                            <Text style={styles.feedbackText}>{cp.feedback}</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        );
    };

    const renderReports = () => {
        return (
            <View style={{ flex: 1 }}>
                {loadingData ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : reportLinks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color="#334155" />
                        <Text style={styles.emptyStateTitle}>No Reports Required</Text>
                        <Text style={styles.emptyStateDesc}>No active report submission links.</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                        {reportLinks.map(link => (
                            <View key={link.id} style={styles.card}>
                                <Text style={styles.cardTitle}>{link.title}</Text>
                                <Text style={styles.cardDesc}>{link.description}</Text>
                                <TouchableOpacity 
                                    style={[styles.primaryButton, { marginTop: 15 }]}
                                    onPress={() => Linking.openURL(link.form_url)}
                                >
                                    <Ionicons name="open-outline" size={18} color="#fff" />
                                    <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Open Form</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
        );
    };

    const renderTeamMembers = () => {
        if (!currentTeam) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateTitle}>No Team Assigned</Text>
                </View>
            );
        }
        return (
            <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={styles.teamHeader}>
                    <Text style={styles.teamTitle}>{currentTeam.name}</Text>
                    {currentTeam.batches?.name && (
                        <View style={styles.batchBadge}>
                            <Text style={styles.batchText}>{currentTeam.batches.name}</Text>
                        </View>
                    )}
                </View>
                {currentTeam.team_members?.map(m => {
                    const name = m.profiles?.full_name || 'Unknown';
                    const initial = name.charAt(0).toUpperCase();
                    const isLeader = m.role === 'leader';
                    return (
                        <View key={m.id} style={styles.memberCard}>
                            <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{name}</Text>
                                <Text style={styles.memberRole}>{m.profiles?.email}</Text>
                            </View>
                            {isLeader && <View style={styles.leaderBadge}><Text style={styles.leaderText}>Leader</Text></View>}
                        </View>
                    );
                })}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Projects & Team</Text>
            </View>

            {renderTabs()}

            <View style={styles.body}>
                {activeTab === 'team' && renderTeamProjects()}
                {activeTab === 'custom' && renderCustomProjects()}
                {activeTab === 'reports' && renderReports()}
                {activeTab === 'members' && renderTeamMembers()}
            </View>

            {/* Team Project Modal */}
            <Modal visible={showTeamModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Submit Project</Text>
                            <TouchableOpacity onPress={() => setShowTeamModal(false)}>
                                <Ionicons name="close" size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ padding: 20 }}>
                            <Text style={styles.inputLabel}>Live / Deployed URL (Required)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="https://..."
                                placeholderTextColor="#475569"
                                value={modalLiveUrl}
                                onChangeText={setModalLiveUrl}
                            />

                            <Text style={styles.inputLabel}>GitHub URL (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="https://github.com/..."
                                placeholderTextColor="#475569"
                                value={modalGithubUrl}
                                onChangeText={setModalGithubUrl}
                            />

                            <Text style={styles.inputLabel}>Notes (Optional)</Text>
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                placeholder="Any additional notes..."
                                placeholderTextColor="#475569"
                                multiline
                                value={modalNotes}
                                onChangeText={setModalNotes}
                            />

                            <TouchableOpacity 
                                style={[styles.primaryButton, { marginTop: 20, marginBottom: 40 }]}
                                onPress={handleTeamSubmit}
                                disabled={submittingTeam}
                            >
                                {submittingTeam ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Submit</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Custom Project Modal */}
            <Modal visible={showCustomModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Submit Custom Project</Text>
                            <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                                <Ionicons name="close" size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ padding: 20 }}>
                            <Text style={styles.inputLabel}>Project Title (Required)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="E.g., Personal Portfolio"
                                placeholderTextColor="#475569"
                                value={cpTitle}
                                onChangeText={setCpTitle}
                            />

                            <Text style={styles.inputLabel}>Description (Required)</Text>
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                placeholder="What is this project about?"
                                placeholderTextColor="#475569"
                                multiline
                                value={cpDesc}
                                onChangeText={setCpDesc}
                            />

                            <Text style={styles.inputLabel}>Live / Deployed URL (Required)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="https://..."
                                placeholderTextColor="#475569"
                                value={cpLiveUrl}
                                onChangeText={setCpLiveUrl}
                            />

                            <Text style={styles.inputLabel}>GitHub URL (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="https://github.com/..."
                                placeholderTextColor="#475569"
                                value={cpGithubUrl}
                                onChangeText={setCpGithubUrl}
                            />

                            <TouchableOpacity 
                                style={[styles.primaryButton, { marginTop: 20, marginBottom: 40 }]}
                                onPress={submitCustomProject}
                                disabled={submittingCustom}
                            >
                                {submittingCustom ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Submit</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1f1f2e',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
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
        marginBottom: 15,
    },
    feedbackBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        marginBottom: 15,
        borderLeftWidth: 3,
        borderLeftColor: '#ef4444',
    },
    feedbackTitle: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    feedbackText: {
        color: '#f8fafc',
        fontSize: 13,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
    },
    primaryButtonText: {
        color: colors.background,
        fontWeight: 'bold',
        fontSize: 15,
    },
    actionHeader: {
        padding: 20,
        paddingBottom: 0,
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
    teamHeader: {
        backgroundColor: colors.surface,
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    teamTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    batchBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    batchText: {
        color: '#8b5cf6',
        fontSize: 12,
        fontWeight: 'bold',
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(99,102,241,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#818cf8',
        fontWeight: 'bold',
        fontSize: 18,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    memberRole: {
        color: '#94a3b8',
        fontSize: 13,
        marginTop: 2,
    },
    leaderBadge: {
        backgroundColor: 'rgba(245,158,11,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    leaderText: {
        color: '#fbbf24',
        fontSize: 11,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        minHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1f1f2e',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    inputLabel: {
        color: '#cbd5e1',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 12,
        color: colors.text,
        fontSize: 15,
    },
});
