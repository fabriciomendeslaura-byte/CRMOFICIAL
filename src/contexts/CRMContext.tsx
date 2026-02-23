/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Lead, User, PipelineStage, Role, CalendarEvent, ChatMessage } from '../pages/types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useToast } from './ToastContext';
import { MOCK_LEADS, MOCK_USERS } from '../constants';
import { logger } from '../lib/logger';

interface CRMContextType {
    users: User[];
    leads: Lead[];
    currentUser: User | null;
    companyInsights: string;
    isLoading: boolean;
    isOnline: boolean;
    isUsingMockData: boolean;
    hasNewInsights: boolean;
    setCurrentUser: (user: User | null) => void;
    signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    updateCompanyInsights: (text: string) => Promise<void>;
    markInsightsAsRead: () => void;
    addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'companyId'>) => Promise<void>;
    updateLead: (lead: Lead) => Promise<void>;
    deleteLead: (id: string) => Promise<void>;
    moveLeadStage: (id: string, stage: PipelineStage) => Promise<void>;
    meetings: CalendarEvent[];
    addMeeting: (meeting: Omit<CalendarEvent, 'id'>) => Promise<void>;
    updateMeeting: (meeting: CalendarEvent) => Promise<void>;
    deleteMeeting: (id: string) => Promise<void>;
    exportCSV: (filteredLeads: Lead[]) => void;
    refreshData: () => Promise<void>;
    generateLeadStrategy: (leadId: string) => Promise<string>;
    chatWithAI: (message: string) => Promise<string>;
    chatHistory: ChatMessage[];
    clearChatHistory: () => void;
    addMessage: (role: 'user' | 'assistant', content: string) => Promise<void>;
    isLoadingChat: boolean;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

// Default admin user for preview/demo mode
const DEFAULT_ADMIN: User = {
    id: 1,
    // SECURITY: ensuring mock data never loads in production
    authUserId: import.meta.env.DEV ? 'admin-preview' : null,
    name: 'Administrador Omni',
    email: 'admin@omni.ia',
    role: 'admin' as Role,
    companyId: 1,
    isActive: true
};

export const useCRM = () => {
    const context = useContext(CRMContext);
    if (!context) {
        throw new Error('useCRM must be used within a CRMProvider');
    }
    return context;
};

export const CRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addToast } = useToast();

    // --- STATE ---
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
    const [meetings, setMeetings] = useState<CalendarEvent[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [companyInsights, setCompanyInsights] = useState<string>('Bem-vindo ao CRM Omni. Este é o seu painel estratégico.');
    const [hasNewInsights, setHasNewInsights] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isUsingMockData, setIsUsingMockData] = useState(!isSupabaseConfigured());

    // Notification system state
    const notifiedEventsRef = React.useRef<Set<string>>(new Set());

    // --- MAPPERS (Pure/Stable Logic) ---
    const mapLeadFromDB = useCallback((data: Record<string, unknown>): Lead => ({
        id: String(data.id),
        name: (data.nome as string) || 'Sem nome',
        company: (data.empresa as string) || '',
        email: (data.email as string) || '',
        phone: (data.telefone as string) || '',
        source: data.origem as Lead['source'],
        value: Number(data.valor) || 0,
        createdAt: (data.data_criacao as string) || (data.created_at as string) || new Date().toISOString(),
        stage: data.etapa_pipeline as PipelineStage,
        ownerId: data.responsavel_id as number,
        notes: (data.observacoes as string) || '',
        companyId: data.company_id as number,
        insights: (data.insights as string) || '',
        automationEnabled: (data.automation_enabled as boolean) || false,
        lastInsightDate: (data.last_insight_date as string) || null
    }), []);

    const mapUserFromDB = useCallback((data: Record<string, unknown>, authEmail?: string): User => ({
        id: data.id as number,
        authUserId: data.auth_user_id as string,
        name: data.nome as string,
        email: authEmail || (data.email as string),
        role: data.papel as Role,
        companyId: data.company_id as number,
        isActive: data.is_active as boolean,
        avatarUrl: data.avatar_url as string | undefined
    }), []);

    const mapLeadToDB = useCallback((lead: Omit<Lead, 'id' | 'createdAt' | 'companyId'>) => ({
        nome: lead.name,
        empresa: lead.company,
        email: lead.email,
        telefone: lead.phone,
        origem: lead.source,
        valor: lead.value,
        etapa_pipeline: lead.stage,
        responsavel_id: lead.ownerId,
        observacoes: lead.notes,
        insights: lead.insights,
        automation_enabled: lead.automationEnabled,
        company_id: currentUser?.companyId || 1
    }), [currentUser]);

    const mapMeetingFromDB = useCallback((data: Record<string, unknown>): CalendarEvent => ({
        id: String(data.id),
        summary: (data.summary as string) || 'Sem título',
        description: (data.description as string) || '',
        location: (data.location as string) || '',
        start: { dateTime: (data.start_time as string) },
        end: { dateTime: (data.end_time as string) },
        leadId: data.lead_id ? String(data.lead_id) : undefined,
        meeting_link: (data.meeting_link as string) || '',
        userId: data.user_id as number
    }), []);

    const mapMeetingToDB = useCallback((m: Omit<CalendarEvent, 'id'>) => ({
        summary: m.summary,
        description: m.description,
        location: m.location,
        start_time: m.start.dateTime,
        end_time: m.end.dateTime,
        lead_id: m.leadId ? Number(m.leadId) : null,
        company_id: currentUser?.companyId || 1,
        meeting_link: m.meeting_link,
        user_id: m.userId || currentUser?.id
    }), [currentUser]);

    // --- CHAT & NOTIFICATION HELPERS ---
    const saveChatMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
        const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role,
            content,
            timestamp: new Date().toISOString()
        };

        setChatHistory(prev => [...prev, newMessage]);

        if (currentUser && isSupabaseConfigured()) {
            await supabase.from('crm_chat_history').insert({
                user_id: currentUser.authUserId,
                role,
                content,
                company_id: currentUser.companyId
            });
        }
    }, [currentUser]);

    const loadChatHistory = useCallback(async () => {
        if (!currentUser || !isSupabaseConfigured()) return;
        setIsLoadingChat(true);
        try {
            const { data, error } = await supabase
                .from('crm_chat_history')
                .select('*')
                .eq('user_id', currentUser.authUserId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (error) throw error;
            if (data) {
                setChatHistory(data.map(msg => ({
                    id: msg.id,
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content,
                    timestamp: msg.created_at
                })));
            }
        } catch (error) {
            logger.error('Failed to load chat history', error as unknown as Error);
        } finally {
            setIsLoadingChat(false);
        }
    }, [currentUser]);

    const clearChatHistory = useCallback(() => {
        setChatHistory([]);
    }, []);

    const sendNewMeetingNotification = useCallback(async (meeting: CalendarEvent) => {
        if (notifiedEventsRef.current.has(`new-${meeting.id}`)) return;

        const meetingTime = new Date(meeting.start.dateTime).toLocaleString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
        const firstName = currentUser?.name?.split(' ')[0] || 'Vendedor';

        await saveChatMessage('assistant', `🚀 Ótimo, ${firstName}! Acabei de confirmar a reunião com **${meeting.summary}** para ${meetingTime}. \n\nDica: Quer que eu prepare um roteiro rápido para essa conversa?`);

        notifiedEventsRef.current.add(`new-${meeting.id}`);
    }, [currentUser, saveChatMessage]);

    // --- AI & STRATEGY ---
    const chatWithAI = async (message: string): Promise<string> => {
        if (!isSupabaseConfigured()) return 'Supabase não configurado.';

        await saveChatMessage('user', message);
        setIsLoadingChat(true);

        const now = new Date();
        const currentDateTime = now.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
        const queryLower = message.toLowerCase();

        const isMentioned = (text: string) => {
            if (!text) return false;
            const parts = text.toLowerCase().split(' ').filter(p => p.length > 2);
            return parts.some(part => queryLower.includes(part));
        };

        const mentionedLeads = leads.filter(l => isMentioned(l.name) || isMentioned(l.company));
        let strategicContext = "";

        if (mentionedLeads.length > 0) {
            strategicContext = `🎯 **LEADS ENCONTRADOS NA BUSCA:**\n${JSON.stringify(mentionedLeads.map(l => ({
                Nome: l.name, Empresa: l.company, Valor: `R$ ${l.value}`, Etapa: l.stage, Notas: l.notes
            })), null, 2)}`;
        } else {
            const top5 = leads.slice(0, 5).map(l => ({ n: l.name, v: l.value, s: l.stage }));
            const totalValue = leads.reduce((acc, l) => acc + l.value, 0);
            strategicContext = `📊 **VISÃO GERAL DO PIPELINE:**\n- Total de Leads: ${leads.length}\n- Valor em Aberto: R$ ${totalValue}\n- Top 5 Recentes: ${JSON.stringify(top5)}`;
        }

        const relevantMeetings = meetings.filter(m =>
            queryLower.includes(m.summary.toLowerCase()) ||
            (m.leadId && isMentioned(leads.find(l => l.id === m.leadId)?.name || ''))
        );

        let agendaContext = "";
        if (relevantMeetings.length > 0) {
            agendaContext = `📅 **REUNIÕES ENCONTRADAS:**\n${JSON.stringify(relevantMeetings.map(m => ({ Titulo: m.summary, Data: new Date(m.start.dateTime).toLocaleString('pt-BR'), Desc: m.description })))}`;
        } else {
            const upcoming = meetings.filter(m => new Date(m.start.dateTime) >= now).slice(0, 5).map(m => ({ t: m.summary, d: new Date(m.start.dateTime).toLocaleDateString() }));
            agendaContext = `📅 **PRÓXIMAS REUNIÕES:** ${JSON.stringify(upcoming)}`;
        }

        try {
            const { data, error } = await supabase.functions.invoke('ai-advisor', {
                body: {
                    action: 'chat',
                    payload: {
                        context: `${strategicContext} | ${agendaContext}`,
                        message,
                        history: chatHistory.slice(-6),
                        userName: currentUser?.name?.split(' ')[0] || 'Vendedor'
                    }
                }
            });

            if (error) throw error;
            const reply = data.reply;
            await saveChatMessage('assistant', reply);
            return reply;
        } catch (error) {
            logger.error("AI Error", error as Error);
            const errReply = "Erro ao conectar à IA via Edge Function.";
            await saveChatMessage('assistant', errReply);
            return errReply;
        } finally {
            setIsLoadingChat(false);
        }
    };

    const generateLeadStrategy = async (leadId: string): Promise<string> => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return 'Lead não encontrado.';
        if (!isSupabaseConfigured()) return 'Supabase não configurado.';

        try {
            const { data, error } = await supabase.functions.invoke('ai-advisor', {
                body: {
                    action: 'strategy',
                    payload: {
                        leadName: lead.name,
                        company: lead.company,
                        value: lead.value,
                        notes: lead.notes
                    }
                }
            });

            if (error) throw error;
            return data.reply;
        } catch (error) {
            logger.error("Strategy Error", error as Error);
            return "Falha ao gerar estratégia via Edge Function.";
        }
    };

    // --- DATA MANAGEMENT ---
    const fetchData = useCallback(async () => {
        if (!isOnline || !isSupabaseConfigured() || !currentUser) {
            if (!isSupabaseConfigured()) {
                setIsUsingMockData(true);
                setIsLoading(false);
                if (!currentUser) setCurrentUser(DEFAULT_ADMIN);
            }
            return;
        }

        try {
            setIsUsingMockData(false);
            const companyId = currentUser.companyId;
            const isAdmin = currentUser.role === 'admin';

            const [usersRes, leadsRes, meetingsRes, companyRes] = await Promise.all([
                supabase.from('crm_users').select('*').eq('company_id', companyId),
                isAdmin ? supabase.from('crm_leads').select('*').eq('company_id', companyId) : supabase.from('crm_leads').select('*').eq('responsavel_id', currentUser.id),
                isAdmin ? supabase.from('crm_meetings').select('*').eq('company_id', companyId) : supabase.from('crm_meetings').select('*').eq('user_id', currentUser.id),
                supabase.from('crm_companies').select('*').eq('id', companyId).maybeSingle()
            ]);

            if (usersRes.data) setUsers(usersRes.data.map(u => mapUserFromDB(u)));
            if (leadsRes.data) setLeads(leadsRes.data.map(mapLeadFromDB));
            if (meetingsRes.data) setMeetings(meetingsRes.data.map(mapMeetingFromDB));
            if (companyRes.data?.insights_e_melhorias && companyRes.data.insights_e_melhorias !== companyInsights) {
                setCompanyInsights(companyRes.data.insights_e_melhorias);
                setHasNewInsights(true);
            }
        } catch (e) {
            logger.error('Fetch Error', e as Error);
        } finally {
            setIsLoading(false);
        }
    }, [isOnline, currentUser, mapLeadFromDB, mapMeetingFromDB, mapUserFromDB, companyInsights]);

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        await fetchData();
    }, [fetchData]);

    // --- LIFECYCLE EFFECTS ---
    // 1. Network
    useEffect(() => {
        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
    }, []);

    // 2. Initial Auth & Auto-refresh
    useEffect(() => {
        const initAuth = async () => {
            if (!isSupabaseConfigured()) {
                setCurrentUser(DEFAULT_ADMIN);
                setIsLoading(false);
                return;
            }
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) { setIsLoading(false); return; }

            if (session?.user) {
                const { data } = await supabase.from('crm_users').select('*').eq('auth_user_id', session.user.id).single();
                if (data && data.is_active) {
                    setCurrentUser(mapUserFromDB(data, session.user.email));
                } else {
                    await supabase.auth.signOut();
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, [mapUserFromDB]);

    // 3. Data Sync on User change
    useEffect(() => {
        if (currentUser) fetchData();
    }, [currentUser, fetchData]);

    // 4. Chat History Load on User change
    useEffect(() => {
        if (currentUser) loadChatHistory();
    }, [currentUser, loadChatHistory]);

    // 5. Realtime Subscriptions
    useEffect(() => {
        if (!currentUser || !isSupabaseConfigured()) return;
        const channel = supabase
            .channel('crm-realtime-sub')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crm_meetings', filter: `company_id=eq.${currentUser.companyId}` }, (payload) => {
                const newM = mapMeetingFromDB(payload.new as Record<string, unknown>);
                setMeetings(prev => prev.find(m => m.id === newM.id) ? prev : [...prev, newM]);
                sendNewMeetingNotification(newM);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser, mapMeetingFromDB, sendNewMeetingNotification]);

    // 6. Reminders
    useEffect(() => {
        const check = () => {
            const now = new Date();
            meetings.forEach(m => {
                const diffMin = (new Date(m.start.dateTime).getTime() - now.getTime()) / 60000;
                if (diffMin >= 29.5 && diffMin <= 30.5 && !notifiedEventsRef.current.has(m.id)) {
                    addToast({ title: 'Lembrete de Reunião', description: `Sua reunião "${m.summary}" começa em 30 min.`, type: 'info' });
                    saveChatMessage('assistant', `⏰ **Lembrete:** Sua reunião **"${m.summary}"** começa em 30 minutos!`);
                    notifiedEventsRef.current.add(m.id);
                }
            });
        };
        const intv = setInterval(check, 60000);
        check();
        return () => clearInterval(intv);
    }, [meetings, addToast, saveChatMessage]);

    // --- CRM ACTIONS ---
    const signIn = async (email: string, pass: string) => {
        setIsLoading(true);
        if (!isSupabaseConfigured()) {
            await new Promise(r => setTimeout(r, 500));
            setCurrentUser(DEFAULT_ADMIN);
            setIsLoading(false);
            return { success: true };
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) { setIsLoading(false); return { success: false, error: error.message }; }

        const { data: userData } = await supabase.from('crm_users').select('*').eq('auth_user_id', data.user.id).single();
        if (userData && userData.is_active) {
            setCurrentUser(mapUserFromDB(userData, data.user.email || ''));
            setIsLoading(false);
            return { success: true };
        }
        await supabase.auth.signOut();
        setIsLoading(false);
        return { success: false, error: 'Acesso negado ou conta inativa.' };
    };

    const signOut = async () => {
        if (isSupabaseConfigured()) await supabase.auth.signOut();
        setCurrentUser(null);
    };

    const updateUser = async (u: User) => {
        setUsers(prev => prev.map(item => item.id === u.id ? u : item));
        await supabase.from('crm_users').update({ nome: u.name, papel: u.role }).eq('id', u.id);
    };

    const updateCompanyInsights = async (text: string) => {
        setCompanyInsights(text);
        if (currentUser) await supabase.from('crm_companies').update({ insights_e_melhorias: text }).eq('id', currentUser.companyId);
    };

    const markInsightsAsRead = () => setHasNewInsights(false);

    const addLead = async (l: Omit<Lead, 'id' | 'createdAt' | 'companyId'>) => {
        const { data, error } = await supabase.from('crm_leads').insert(mapLeadToDB(l)).select().single();
        if (!error && data) setLeads(prev => [mapLeadFromDB(data), ...prev]);
        addToast({ title: 'Lead Criado', type: 'success' });
    };

    const updateLead = async (l: Lead) => {
        setLeads(prev => prev.map(item => item.id === l.id ? l : item));
        await supabase.from('crm_leads').update({
            nome: l.name, empresa: l.company, email: l.email, valor: l.value, etapa_pipeline: l.stage, observacoes: l.notes
        }).eq('id', l.id);
    };

    const deleteLead = async (id: string) => {
        setLeads(prev => prev.filter(l => l.id !== id));
        await supabase.from('crm_leads').delete().eq('id', id);
    };

    const moveLeadStage = async (id: string, stage: PipelineStage) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l));
        await supabase.from('crm_leads').update({ etapa_pipeline: stage }).eq('id', id);
    };

    const exportCSV = (filtered: Lead[]) => {
        const headers = 'Nome,Empresa,Email,Telefone,Valor,Status\n';
        const rows = filtered.map(l => `"${l.name}","${l.company}","${l.email}","${l.phone}","${l.value}","${l.stage}"`).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'leads_crm.csv'; a.click();
    };

    const addMeeting = async (m: Omit<CalendarEvent, 'id'>) => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.from('crm_meetings').insert(mapMeetingToDB(m)).select().single();
            if (!error && data) setMeetings(prev => [...prev, mapMeetingFromDB(data)]);
        } else {
            const mockM = { ...m, id: crypto.randomUUID() } as CalendarEvent;
            setMeetings(prev => [...prev, mockM]);
            sendNewMeetingNotification(mockM);
        }
        addToast({ title: 'Agendamento Confirmado', type: 'success' });
    };

    const deleteMeeting = async (id: string) => {
        await supabase.from('crm_meetings').delete().eq('id', id);
        setMeetings(prev => prev.filter(m => m.id !== id));
    };

    const updateMeeting = async (m: CalendarEvent) => {
        setMeetings(prev => prev.map(item => item.id === m.id ? m : item));
        await supabase.from('crm_meetings').update({ summary: m.summary, start_time: m.start.dateTime, end_time: m.end.dateTime }).eq('id', m.id);
    };

    return (
        <CRMContext.Provider value={{
            users, leads, currentUser, companyInsights, isLoading, isOnline, isUsingMockData, hasNewInsights,
            meetings, addMeeting, updateMeeting, deleteMeeting,
            setCurrentUser, signIn, signOut, updateUser, updateCompanyInsights,
            markInsightsAsRead, addLead, updateLead, deleteLead, moveLeadStage, exportCSV, refreshData,
            generateLeadStrategy, chatWithAI, chatHistory, clearChatHistory, isLoadingChat,
            addMessage: saveChatMessage
        }}>
            {children}
        </CRMContext.Provider>
    );
};
