import React from 'react';
import { useAudio } from './AudioProvider';
import { supabase } from '../lib/supabase';
import { PandaaBotCore } from '../../../shared/pandaa/PandaaBotCore';

export const PandaaBot: React.FC = () => {
    const { playClick } = useAudio();

    return <PandaaBotCore playClick={playClick} supabase={supabase} contactSource="LANDING_PAGE" />;
};
