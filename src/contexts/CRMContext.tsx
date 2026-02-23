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
    authUserId: 'admin-preview',
    name: 'Administrador Oficial',
    email: 'admin@oficial.ia',
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
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
    const [meetings, setMeetings] = useState<CalendarEvent[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [companyInsights, setCompanyInsights] = useState<string>('Bem-vindo ao CRM.OFICIAL. Este é o seu painel estratégico.');
    const [hasNewInsights, setHasNewInsights] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isLoadingChat, setIsLoadingChat] = useState(false);

    // Ref to track if it's the initial load of history
    const notifiedEventsRef = React.useRef<Set<string>>(new Set());

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

    // Polling for meeting reminders (Every 1 minute)
    useEffect(() => {
        const checkMeetings = () => {
            const now = new Date();
            meetings.forEach(meeting => {
                const meetingTime = new Date(meeting.start.dateTime);
                const timeDiff = meetingTime.getTime() - now.getTime();
                const minutesUntil = timeDiff / 1000 / 60;

                // Notify if meeting is between 29.5 and 30.5 minutes away
                if (minutesUntil >= 29.5 && minutesUntil <= 30.5 && !notifiedEventsRef.current.has(meeting.id)) {
                    // 1. Classic Toast Notification
                    addToast({
                        title: `🤖 Omni-Bot: Reunião "${meeting.summary}" em 30min!`,
                        type: 'info'
                    });

                    // 2. Proactive AI Message
                    saveChatMessage('assistant', `🤖 **OMNI-ADVISOR:** Olá! Passando para te lembrar da reunião **"${meeting.summary}"** que começa em 30 minutos. Já conferiu a pauta? Boa sorte! 🚀`);

                    notifiedEventsRef.current.add(meeting.id);
                }
            });
        };

        // Check immediately and then every 60s
        checkMeetings();
        const interval = setInterval(checkMeetings, 60000);
        return () => clearInterval(interval);
    }, [meetings, addToast, saveChatMessage]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isUsingMockData, setIsUsingMockData] = useState(!isSupabaseConfigured());

    // --- Network status listeners ---
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // --- Mappers ---
    const mapLeadFromDB = (data: Record<string, unknown>): Lead => ({
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
    });

    const mapUserFromDB = (data: Record<string, unknown>, authEmail?: string): User => ({
        id: data.id as number,
        authUserId: data.auth_user_id as string,
        name: data.nome as string,
        email: authEmail || (data.email as string),
        role: data.papel as Role,
        companyId: data.company_id as number,
        isActive: data.is_active as boolean,
        avatarUrl: data.avatar_url as string | undefined
    });

    const mapLeadToDB = (lead: Omit<Lead, 'id' | 'createdAt' | 'companyId'>) => ({
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
        company_id: currentUser?.companyId || 1 // Dynamic company
    });

    const mapMeetingFromDB = (data: Record<string, unknown>): CalendarEvent => ({
        id: String(data.id),
        summary: (data.summary as string) || 'Sem título',
        description: (data.description as string) || '',
        location: (data.location as string) || '',
        start: { dateTime: (data.start_time as string) },
        end: { dateTime: (data.end_time as string) },
        leadId: data.lead_id ? String(data.lead_id) : undefined,
        meeting_link: (data.meeting_link as string) || '',
        userId: data.user_id as number
    });

    const mapMeetingToDB = (m: Omit<CalendarEvent, 'id'>) => ({
        summary: m.summary,
        description: m.description,
        location: m.location,
        start_time: m.start.dateTime,
        end_time: m.end.dateTime,
        lead_id: m.leadId ? Number(m.leadId) : null,
        company_id: currentUser?.companyId || 1,
        meeting_link: m.meeting_link,
        user_id: m.userId || currentUser?.id
    });

    // --- Auth Functions ---
    const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            if (!isSupabaseConfigured()) {
                logger.info('Using mock auth - Supabase not configured');
                await new Promise(r => setTimeout(r, 500));
                setCurrentUser(DEFAULT_ADMIN);
                setIsLoading(false);
                return { success: true };
            }

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                logger.warn('Sign in failed', { email, error: error.message });
                setIsLoading(false);
                return { success: false, error: error.message };
            }

            if (data.user) {
                // Fetch the user profile from crm_users
                const { data: userData, error: userError } = await supabase
                    .from('crm_users')
                    .select('*')
                    .eq('auth_user_id', data.user.id)
                    .single();

                if (userError || !userData) {
                    logger.error('Access denied - User profile not found', userError as unknown as Error);
                    await supabase.auth.signOut();
                    setIsLoading(false);
                    return { success: false, error: 'Acesso negado: Usuário não cadastrado no CRM.' };
                }

                if (!userData.is_active) {
                    await supabase.auth.signOut();
                    setIsLoading(false);
                    return { success: false, error: 'Acesso negado: Sua conta está inativa.' };
                }

                setCurrentUser(mapUserFromDB(userData, data.user.email));
            }

            setIsLoading(false);
            return { success: true };
        } catch (e) {
            const error = e as Error;
            logger.error('Unexpected error during sign in', error);
            setIsLoading(false);
            return { success: false, error: 'Erro inesperado ao fazer login.' };
        }
    };

    const signOut = async () => {
        setIsLoading(true);
        try {
            if (isSupabaseConfigured()) {
                await supabase.auth.signOut();
            }
            setCurrentUser(null);
            addToast({ title: 'Logout realizado', description: 'Você foi desconectado com sucesso.', type: 'success' });
        } catch (e) {
            logger.error('Error during sign out', e as Error);
            addToast({ title: 'Erro ao sair', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        if (!isOnline) {
            logger.info('Offline - using cached/mock data');
            return;
        }

        if (!isSupabaseConfigured()) {
            logger.info('Supabase not configured - using mock data');
            setIsUsingMockData(true);
            setIsLoading(false);
            // In mock mode, auto-login as admin
            if (!currentUser) setCurrentUser(DEFAULT_ADMIN);
            return;
        }

        try {
            if (!currentUser) return;

            setIsUsingMockData(false);
            const isAdmin = currentUser.role === 'admin';
            const companyId = currentUser.companyId;

            // Filter queries based on company and ownership
            let usersQuery = supabase.from('crm_users').select('*').eq('company_id', companyId);

            let leadsQuery = supabase.from('crm_leads').select('*').eq('company_id', companyId);
            if (!isAdmin) {
                leadsQuery = leadsQuery.eq('responsavel_id', currentUser.id);
            }
            leadsQuery = leadsQuery.order('data_criacao', { ascending: false });

            let meetingsQuery = supabase.from('crm_meetings').select('*').eq('company_id', companyId);
            if (!isAdmin) {
                meetingsQuery = meetingsQuery.eq('user_id', currentUser.id);
            }
            meetingsQuery = meetingsQuery.order('start_time', { ascending: true });

            const [usersResult, leadsResult, meetingsResult, companyResult] = await Promise.allSettled([
                usersQuery,
                leadsQuery,
                meetingsQuery,
                supabase.from('crm_companies').select('insights_e_melhorias').eq('id', companyId).maybeSingle()
            ]);

            if (usersResult.status === 'fulfilled' && usersResult.value.data) {
                setUsers(usersResult.value.data.map(u => mapUserFromDB(u)));
            }

            if (leadsResult.status === 'fulfilled' && leadsResult.value.data) {
                setLeads(leadsResult.value.data.map(mapLeadFromDB));
            }

            if (meetingsResult.status === 'fulfilled' && meetingsResult.value.data) {
                setMeetings(meetingsResult.value.data.map(mapMeetingFromDB));
            }

            if (companyResult.status === 'fulfilled' && companyResult.value.data) {
                const insights = companyResult.value.data.insights_e_melhorias;
                if (insights && insights !== companyInsights) {
                    setCompanyInsights(insights);
                    setHasNewInsights(true);
                }
            }

            logger.debug('Data fetched successfully from Supabase');
        } catch (e) {
            logger.error('Error fetching data from Supabase', e as Error);
            setIsUsingMockData(true);
            addToast({ title: 'Usando dados de demonstração', description: 'Não foi possível conectar ao banco de dados.', type: 'info' });
        } finally {
            setIsLoading(false);
        }
    }, [isOnline, companyInsights, addToast, currentUser]);

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        await fetchData();
    }, [fetchData]);

    // Check auth session on mount
    useEffect(() => {
        const initializeAuth = async () => {
            if (!isSupabaseConfigured()) {
                setCurrentUser(DEFAULT_ADMIN);
                setIsLoading(false);
                return;
            }

            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    logger.error('Session error', sessionError as unknown as Error);
                    setIsLoading(false);
                    return;
                }

                if (session?.user) {
                    const { data: userData, error: userError } = await supabase
                        .from('crm_users')
                        .select('*')
                        .eq('auth_user_id', session.user.id)
                        .single();

                    if (userError || !userData) {
                        logger.warn('User profile not found or error', { message: userError?.message });
                        await supabase.auth.signOut();
                        setCurrentUser(null);
                    } else if (userData) {
                        if (!userData.is_active) {
                            await supabase.auth.signOut();
                            setCurrentUser(null);
                        } else {
                            setCurrentUser(mapUserFromDB(userData, session.user.email));
                        }
                    }
                }
            } catch (err) {
                logger.error('Unexpected auth initialization error', err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    }, [currentUser, fetchData]);

    // --- CRUD Actions ---
    const updateCompanyInsights = async (text: string) => {
        setCompanyInsights(text);
        addToast({ title: 'Insights atualizados', type: 'success' });

        if (isSupabaseConfigured() && currentUser) {
            const { error } = await supabase.from('crm_companies').update({ insights_e_melhorias: text }).eq('id', currentUser.companyId);
            if (error) logger.error('Failed to update company insights', error as unknown as Error);
        }
    };

    const markInsightsAsRead = () => setHasNewInsights(false);

    const updateUser = async (u: User) => {
        setUsers(prev => prev.map(item => item.id === u.id ? u : item));
        addToast({ title: 'Usuário atualizado', type: 'success' });

        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('crm_users').update({ nome: u.name, papel: u.role }).eq('id', u.id);
            if (error) logger.error('Failed to update user', error as unknown as Error);
        }
    };

    const addLead = async (l: Omit<Lead, 'id' | 'createdAt' | 'companyId'>) => {
        const newId = crypto.randomUUID();
        const newLead: Lead = {
            ...l,
            id: newId,
            createdAt: new Date().toISOString(),
            companyId: currentUser?.companyId || 1
        };

        setLeads(prev => [newLead, ...prev]);

        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('crm_leads').insert(mapLeadToDB(l));
            if (error) {
                logger.error('Failed to add lead', error as unknown as Error);
                addToast({ title: 'Lead criado localmente', description: 'Erro ao sincronizar com o banco.', type: 'info' });
                return;
            }
        }

        addToast({ title: 'Lead Criado', type: 'success' });
    };

    const updateLead = async (l: Lead) => {
        setLeads(prev => prev.map(item => item.id === l.id ? l : item));

        if (isSupabaseConfigured()) {
            const companyId = currentUser?.companyId;
            const { error } = await supabase.from('crm_leads').update({
                nome: l.name,
                empresa: l.company,
                email: l.email,
                telefone: l.phone,
                origem: l.source,
                valor: l.value,
                etapa_pipeline: l.stage,
                responsavel_id: l.ownerId,
                observacoes: l.notes,
                insights: l.insights,
                automation_enabled: l.automationEnabled
            }).eq('id', l.id).eq('company_id', companyId!);

            if (error) {
                logger.error('Failed to update lead', error as unknown as Error);
                addToast({ title: 'Lead atualizado localmente', description: 'Erro ao sincronizar.', type: 'info' });
                return;
            }
        }

        addToast({ title: 'Lead Salvo', type: 'success' });
    };

    const deleteLead = async (id: string) => {
        setLeads(prev => prev.filter(l => l.id !== id));

        if (isSupabaseConfigured()) {
            const companyId = currentUser?.companyId;
            const { error } = await supabase.from('crm_leads').delete().eq('id', id).eq('company_id', companyId!);
            if (error) {
                logger.error('Failed to delete lead', error as unknown as Error);
            }
        }

        addToast({ title: 'Lead Removido', type: 'success' });
    };

    const moveLeadStage = async (id: string, stage: PipelineStage) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l));

        if (isSupabaseConfigured()) {
            const companyId = currentUser?.companyId;
            const { error } = await supabase.from('crm_leads').update({ etapa_pipeline: stage }).eq('id', id).eq('company_id', companyId!);
            if (error) logger.error('Failed to update lead stage', error as unknown as Error);
        }
    };

    const sanitizeCSVField = (value: string | number): string => {
        const str = String(value ?? '').replace(/"/g, '""');
        // CSV Injection guard: prefix dangerous chars with a tab
        return /^[=+\-@\t\r]/.test(str) ? `\t${str}` : str;
    };

    const exportCSV = (filtered: Lead[]) => {
        const headers = 'Nome,Empresa,Email,Telefone,Valor,Origem,Status\n';
        const rows = filtered.map(l =>
            `"${sanitizeCSVField(l.name)}","${sanitizeCSVField(l.company)}","${sanitizeCSVField(l.email)}","${sanitizeCSVField(l.phone)}","${sanitizeCSVField(l.value)}","${sanitizeCSVField(l.source)}","${sanitizeCSVField(l.stage)}"`
        ).join('\n');
        const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const addMeeting = async (m: Omit<CalendarEvent, 'id'>) => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.from('crm_meetings').insert(mapMeetingToDB(m)).select().single();
            if (error) {
                logger.error('Failed to add meeting', error as unknown as Error);
                addToast({ title: 'Erro ao agendar no servidor', type: 'error' });
                return;
            }
            if (data) setMeetings(prev => [...prev, mapMeetingFromDB(data)]);
        } else {
            const newMeeting = { ...m, id: crypto.randomUUID() };
            setMeetings(prev => [...prev, newMeeting as CalendarEvent]);
        }
        addToast({ title: 'Agendamento Confirmado', type: 'success' });
    };

    const deleteMeeting = async (id: string) => {
        if (isSupabaseConfigured()) {
            const companyId = currentUser?.companyId;
            const { error } = await supabase.from('crm_meetings').delete().eq('id', id).eq('company_id', companyId!);
            if (error) {
                logger.error('Failed to delete meeting', error as unknown as Error);
                return;
            }
        }
        setMeetings(prev => prev.filter(m => m.id !== id));
        addToast({ title: 'Agendamento Removido', type: 'success' });
    };

    const updateMeeting = async (m: CalendarEvent) => {
        setMeetings(prev => prev.map(item => item.id === m.id ? m : item));

        if (isSupabaseConfigured()) {
            const companyId = currentUser?.companyId;
            const { error } = await supabase.from('crm_meetings').update({
                summary: m.summary,
                description: m.description,
                location: m.location,
                start_time: m.start.dateTime,
                end_time: m.end.dateTime,
                lead_id: m.leadId ? Number(m.leadId) : null,
                meeting_link: m.meeting_link
            }).eq('id', m.id).eq('company_id', companyId!);

            if (error) {
                logger.error('Failed to update meeting', error as unknown as Error);
                addToast({ title: 'Erro ao atualizar no servidor', type: 'error' });
                return;
            }
        }
        addToast({ title: 'Agendamento Atualizado', type: 'success' });
    };

    const generateLeadStrategy = async (leadId: string): Promise<string> => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return 'Lead não encontrado.';

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) return 'Chave da OpenAI não configurada (VITE_OPENAI_API_KEY).';

        try {
            const prompt = `Consultor de Vendas CRM.OFICIAL.
Analise: ${lead.name} (${lead.company}), R$ ${lead.value}, Etapa ${lead.stage}, Notas: ${lead.notes}.
Gere JSON curto:
{ "abordagem": "1 frase direta", "objecoes": "2 pontos curtos", "script_whatsapp": "Texto curto para enviar agora" }`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: prompt }],
                    max_tokens: 300
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const content = JSON.parse(data.choices[0].message.content.replace(/```json|```/g, ''));
            const strategy = `### 🎯 Estratégia Rápida: ${lead.name}

**Abordagem:** ${content.abordagem}

**Objeções:**
${content.objecoes}

**Zap:** "${content.script_whatsapp}"`;

            const updatedLead = { ...lead, insights: strategy, lastInsightDate: new Date().toISOString() };
            await updateLead(updatedLead);

            return strategy;
        } catch (error) {
            logger.error("OpenAI Error", error as Error);
            return "Estratégia: Foque no ROI e tente agendar uma call rápida. (Erro na formatação da IA)";
        }
    };

    const loadChatHistory = async () => {
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
    };


    const clearChatHistory = async () => {
        setChatHistory([]);
        // Optional: Delete from DB logic if needed
    };

    const chatWithAI = async (message: string): Promise<string> => {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) return 'Chave da OpenAI não configurada.';

        // Save user message
        await saveChatMessage('user', message);

        // Context Construction
        const leadContext = leads.map(l => ({
            nome: l.name,
            empresa: l.company,
            valor: l.value,
            etapa: l.stage
        })).slice(0, 10); // Increased context slightly

        const meetingsContext = meetings.map(m => ({
            titulo: m.summary,
            inicio: new Date(m.start.dateTime).toLocaleString('pt-BR'),
            cliente: m.leadId ? leads.find(l => l.id === m.leadId)?.name : 'N/A'
        }));

        const systemPrompt = `Bot: Omni-Bot. Usuário: ${currentUser?.name || 'Vendedor'}.
Contexto: Teu histórico de conversa anterior é crucial. Use-o para ser caloroso.
Dados de Leads: ${JSON.stringify(leadContext)}...
Dados da Agenda: ${JSON.stringify(meetingsContext)}...

Diretrizes:
1. Seja EXTREMAMENTE educado, gentil e humano.
2. Use o nome do usuário para criar conexão.
3. Responda de forma concisa, mas com "calor humano".
4. Use emojis amigáveis (😊, 🚀, 💡, 📅).
5. Se perguntado sobre a agenda, liste as reuniões de forma clara.
6. Monitore as oportunidades e sugira ações.`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...chatHistory.map(m => ({ role: m.role, content: m.content })).slice(-10), // Context window
                        { role: 'user', content: message }
                    ],
                    max_tokens: 150
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const reply = data.choices[0].message.content;
            await saveChatMessage('assistant', reply);
            return reply;
        } catch (error) {
            logger.error("OpenAI Chat Error", error as Error);
            const errorMsg = "Estou com dificuldades para conectar ao cérebro agora.";
            await saveChatMessage('assistant', errorMsg);
            return errorMsg;
        }
    };

    useEffect(() => {
        if (currentUser) {
            loadChatHistory();
        }
    }, [currentUser]);

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
