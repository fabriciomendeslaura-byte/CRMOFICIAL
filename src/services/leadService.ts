import { supabase } from '../lib/supabase';
import { Lead } from '../pages/types';

export const leadService = {
    async getAllLeads() {
        const { data, error } = await supabase
            .from('crm_leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Lead[];
    },

    async createLead(lead: Partial<Lead>) {
        const { data, error } = await supabase
            .from('crm_leads')
            .insert([lead])
            .select()
            .single();

        if (error) throw error;
        return data as Lead;
    },

    async updateLead(id: string, updates: Partial<Lead>) {
        const { data, error } = await supabase
            .from('crm_leads')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Lead;
    },

    async deleteLead(id: string) {
        const { error } = await supabase
            .from('crm_leads')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
