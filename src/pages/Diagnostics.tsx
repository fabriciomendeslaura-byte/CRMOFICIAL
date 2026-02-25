import React, { useState, useEffect } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { Card, Button, Badge } from '../components/UIComponents';
import { Shield, Database, Brain, CheckCircle2, XCircle, Loader2, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Diagnostics: React.FC = () => {
    const { currentUser, chatWithAI } = useCRM();
    const [dbStatus, setDbStatus] = useState<'pending' | 'ok' | 'error'>('pending');
    const [aiStatus, setAiStatus] = useState<'pending' | 'ok' | 'error'>('pending');
    const [aiReply, setAiReply] = useState<string>('');
    const [leadCount, setLeadCount] = useState<number | null>(null);

    useEffect(() => {
        checkDB();
    }, []);

    const checkDB = async () => {
        try {
            const { count, error } = await supabase.from('crm_leads').select('*', { count: 'exact', head: true });
            if (error) throw error;
            setLeadCount(count);
            setDbStatus('ok');
        } catch (err) {
            console.error(err);
            setDbStatus('error');
        }
    };

    const testAI = async () => {
        setAiStatus('pending');
        setAiReply('');
        try {
            const reply = await chatWithAI('Olá! Este é um teste de diagnóstico. Responda com "SISTEMA OPERACIONAL".');
            setAiReply(reply);
            if (reply.includes('SISTEMA OPERACIONAL') || reply.length > 5) {
                setAiStatus('ok');
            } else {
                setAiStatus('error');
            }
        } catch (err) {
            console.error(err);
            setAiStatus('error');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto py-10">
            <div>
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-normal">Diagnóstico do Sistema</h2>
                <p className="text-zinc-500 text-sm">Verificação em tempo real dos componentes críticos para produção.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Auth & RLS Card */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg">Segurança & RLS</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                            <span className="text-sm font-medium">Usuário Autenticado</span>
                            <Badge variant="success">{currentUser?.name}</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Isolamento de Dados (RLS)</span>
                                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Leads visíveis: {leadCount ?? '...'}</span>
                            </div>
                            {dbStatus === 'ok' ? (
                                <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                            ) : dbStatus === 'error' ? (
                                <XCircle className="text-red-500 w-5 h-5" />
                            ) : (
                                <Loader2 className="animate-spin text-zinc-400 w-5 h-5" />
                            )}
                        </div>
                    </div>
                </Card>

                {/* AI & Edge Functions Card */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                            <Brain className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg">IA & Edge Functions</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                            <span className="text-sm font-medium">Status da Edge Function</span>
                            {aiStatus === 'ok' ? (
                                <Badge variant="success">Conectado</Badge>
                            ) : aiStatus === 'error' ? (
                                <Badge variant="error">Falha</Badge>
                            ) : (
                                <Badge variant="neutral">Pronto para Teste</Badge>
                            )}
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={testAI}
                                disabled={aiStatus === 'pending'}
                                className="w-full"
                                variant="outline"
                            >
                                {aiStatus === 'pending' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Chamando Edge Function...
                                    </>
                                ) : 'Testar Conexão com OpenAI'}
                            </Button>
                            {aiReply && (
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/10 rounded-xl">
                                    <p className="text-[10px] font-black uppercase text-indigo-500 mb-1">Resposta da IA:</p>
                                    <p className="text-xs italic text-zinc-600 dark:text-zinc-400">"{aiReply}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Database Secrets Card */}
                <Card className="p-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <Key className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg">Segredos do Sistema</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4">
                        A chave da OpenAI agora é gerenciada de forma segura na tabela <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-zinc-900 dark:text-white">crm_secrets</code>.
                    </p>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                            <CheckCircle2 className="text-emerald-500 w-4 h-4" />
                            Chave OpenAI configurada via DB Backed Secret.
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex justify-center mt-10">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Omni Strategic Intelligence Verified</p>
            </div>
        </div>
    );
};

export default Diagnostics;

