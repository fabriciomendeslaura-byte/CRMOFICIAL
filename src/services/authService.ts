import { supabase } from '../lib/supabase';

export interface UserProfile {
    id: string;
    auth_user_id: string;
    nome: string;
    email: string;
    papel: 'admin' | 'vendedor';
    company_id: string;
    is_active: boolean;
}

export const authService = {
    async getCurrentProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('crm_users')
            .select('*')
            .eq('auth_user_id', user.id)
            .single();

        if (error) throw error;
        return data as UserProfile;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return true;
    }
};
