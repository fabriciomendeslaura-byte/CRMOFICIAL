import React, { useState, useEffect } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { Card, Button, Textarea } from '../components/UIComponents';
import { Sparkles, Save, Lightbulb, Target, TrendingUp, ShieldCheck, CheckCircle2, BrainCircuit } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Insights: React.FC = () => {
  const { companyInsights, currentUser, markInsightsAsRead } = useCRM();
  const [localText, setLocalText] = useState('');
  const { addToast } = useToast();

  // Sincroniza o estado local com os dados vindos do banco ao carregar a página
  useEffect(() => {
    setLocalText(companyInsights || '');
  }, [companyInsights]);

  // Ao entrar na página, marca os insights como lidos para remover a notificação
  useEffect(() => {
    markInsightsAsRead();
  }, []);

  const handleDownload = () => {
    if (!localText) {
        addToast({ title: 'Vazio', description: 'Não há conteúdo para baixar.', type: 'info' });
        return;
    }
    const element = document.createElement("a");
    const file = new Blob([localText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Insights-Estrategicos-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addToast({ title: 'Download Iniciado', description: 'O arquivo foi salvo no seu computador.', type: 'success' });
  };

  // Lógica da Lanterna: Se tiver texto, ela "acende"
  const hasContent = localText && localText.trim().length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-normal flex items-center gap-3">
            Estratégia & Insights <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">
            Painel de inteligência global e direcionamento estratégico da empresa.
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
           <ShieldCheck className="w-5 h-5" />
           <span className="text-sm font-bold">Dados da Empresa</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
           {/* Card Azul Escuro Profundo */}
           <Card className="p-1 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 shadow-2xl shadow-blue-900/20 border-0">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 h-full relative z-10 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-zinc-800 dark:text-white flex items-center gap-3">
                       {/* LÓGICA DA LANTERNA (LIGHTBULB) */}
                       <div className={`p-2 rounded-full transition-all duration-700 ${hasContent ? 'bg-amber-100 dark:bg-amber-900/20 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                           <Lightbulb 
                              className={`w-5 h-5 transition-all duration-700 ${
                                 hasContent 
                                 ? 'text-amber-500 fill-amber-500' // ACESA (Amarela e Preenchida)
                                 : 'text-zinc-400 dark:text-zinc-500' // APAGADA (Cinza)
                              }`} 
                           />
                       </div>
                       Planejamento Estratégico
                    </h3>
                    <div className="flex items-center gap-3">
                        {currentUser?.role === 'admin' ? (
                           <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-800">
                              Edição Permitida
                           </span>
                        ) : (
                           <span className="text-xs font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                              Somente Leitura
                           </span>
                        )}
                    </div>
                 </div>
                 
                 <Textarea 
                    value={localText}
                    onChange={(e) => setLocalText(e.target.value)}
                    placeholder="Descreva aqui os objetivos do trimestre, scripts de vendas globais, ou insights de mercado para toda a equipe..."
                    className="min-h-[400px] flex-1 text-base leading-relaxed p-4 bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:ring-blue-500/30 focus:border-blue-500 resize-none font-medium text-zinc-700 dark:text-zinc-300"
                    disabled={currentUser?.role !== 'admin'}
                 />

                 <div className="mt-4 flex justify-end">
                    <Button 
                       onClick={handleDownload}
                       className="gap-2 shadow-lg shadow-blue-900/20 text-white border-0 transition-all !bg-none bg-blue-600 hover:bg-blue-700"
                       title="Salvar no computador"
                    >
                       <Save className="w-4 h-4" />
                       Salvar Insights
                    </Button>
                 </div>
              </div>
           </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
           <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3 text-blue-700 dark:text-blue-400">
                 <Target className="w-6 h-6" />
                 <h4 className="font-bold">Foco do Mês</h4>
              </div>
              <p className="text-sm text-blue-900 dark:text-blue-200/80 leading-relaxed">
                 Utilize este espaço para alinhar a comunicação de toda a equipe. As informações salvas aqui são visíveis para todos os vendedores e administradores da conta.
              </p>
           </div>

           {/* WIDGET RESTAURADO PARA VERDE (EMERALD) */}
           <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3 text-emerald-600 dark:text-emerald-500">
                 <TrendingUp className="w-6 h-6" />
                 <h4 className="font-bold">Dica de Performance</h4>
              </div>
              <p className="text-sm text-emerald-800 dark:text-emerald-200/80 leading-relaxed">
                 Mantenha os insights atualizados semanalmente. Equipes que compartilham estratégias centrais aumentam a conversão em até 30%.
              </p>
           </div>
           
           <div className="p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-center opacity-60">
              <BrainCircuit className="w-10 h-10 mb-2 text-zinc-400" />
              <p className="text-xs text-zinc-500">
                 Integração com IA<br/>em desenvolvimento
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
