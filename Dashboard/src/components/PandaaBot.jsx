import React from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useAudio } from '../contexts/AudioContext';
import { PandaaBotCore } from '../../../shared/pandaa/PandaaBotCore';

export function PandaaBot() {
    const { supabase } = useDashboard();
    const { playClick } = useAudio();

    return <PandaaBotCore supabase={supabase} playClick={playClick} contactSource="DASHBOARD" />;
}
