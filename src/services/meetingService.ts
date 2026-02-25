import { supabase } from '../lib/supabase';

export interface Meeting {
    id: string;
    lead_id: string;
    user_id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'cancelled' | 'completed';
}

export const meetingService = {
    async getAllMeetings() {
        const { data, error } = await supabase
            .from('crm_meetings')
            .select('*')
            .order('start_time', { ascending: true });

        if (error) throw error;
        return data as Meeting[];
    },

    async createMeeting(meeting: Partial<Meeting>) {
        const { data, error } = await supabase
            .from('crm_meetings')
            .insert([meeting])
            .select()
            .single();

        if (error) throw error;
        return data as Meeting;
    },

    async updateMeeting(id: string, updates: Partial<Meeting>) {
        const { data, error } = await supabase
            .from('crm_meetings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Meeting;
    }
};
