
import React, { useState, DragEvent } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { PipelineStage, Lead, PipelineStageLabels, LeadSourceLabels, LeadSource } from './types';
import { Badge, Button, Modal, Input, Select, Textarea } from '../components/UIComponents';
import { Plus, Edit2, ExternalLink, MessageSquare, Clock, CheckCircle2, XCircle, ArrowRight, Lightbulb, Zap, Calendar, BrainCircuit } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import LeadActivityTimeline from '../components/LeadActivityTimeline';

const Pipeline: React.FC = () => {
  const { leads, moveLeadStage, currentUser, users, addLead, updateLead } = useCRM();
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);

  const { addToast } = useToast();
  const { generateLeadStrategy } = useCRM();

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedLeadId(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, stage: PipelineStage) => {
    e.preventDefault();
    if (draggedLeadId) {
      moveLeadStage(draggedLeadId, stage);
      setDraggedLeadId(null);
    }
  };

  const getLeadsByStage = (stage: PipelineStage) => {
    return leads.filter(l => l.stage === stage);
  };

  const getStageTotal = (stage: PipelineStage) => {
    return getLeadsByStage(stage).reduce((acc, curr) => acc + curr.value, 0);
  };

  const openCreate = () => {
    setFormData({
      source: LeadSource.FORMULARIO,
      stage: PipelineStage.NOVO,
      ownerId: currentUser.role === 'vendedor' ? currentUser.id : undefined,
      value: 0,
      automationEnabled: false,
      insights: '',
      lastInsightDate: new Date().toISOString()
    });
    setIsFormOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setFormData({ ...lead });
    setIsFormOpen(true);
  };

  const openDetail = (lead: Lead) => {
    setViewingLead(lead);
    setIsDetailOpen(true);
  };

  /* Removed duplicate openDetail */
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.value === undefined) {
      addToast({ title: "Erro", description: "Preencha nome e valor.", type: 'error' });
      return;
    }

    if (formData.id) {
      updateLead(formData as Lead);
    } else {
      addLead({
        name: formData.name,
        company: formData.company || '',
        email: formData.email || '',
        phone: formData.phone || '',
        value: Number(formData.value),
        source: formData.source || LeadSource.FORMULARIO,
        notes: formData.notes || '',
        stage: formData.stage || PipelineStage.NOVO,
        ownerId: currentUser.role === 'vendedor' ? currentUser.id : Number(formData.ownerId) || currentUser.id,
        insights: formData.insights || '',
        automationEnabled: formData.automationEnabled || false,
        lastInsightDate: formData.lastInsightDate || new Date().toISOString()
      });
    }
    setIsFormOpen(false);
  };

  const copyWhatsApp = () => {
    if (viewingLead) {
      navigator.clipboard.writeText(`https://wa.me/${viewingLead.phone}`);
      addToast({ title: "Link Copiado", description: "Link do WhatsApp na área de transferência", type: 'success' });
    }
  };

  const sendFakeMessage = () => {
    if (viewingLead) {
      addToast({ title: "Mensagem enviada", description: `Olá ${viewingLead.name}, como podemos ajudar?`, type: 'success' });
    }
  };

  const changeDetailStage = (stage: PipelineStage) => {
    if (viewingLead) {
      updateLead({ ...viewingLead, stage });
      setViewingLead({ ...viewingLead, stage });
    }
  };

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { notation: "compact", maximumFractionDigits: 1 })}`;

  const getDaysNextInsight = (lastDate?: string) => {
    if (!lastDate) return 0;
    const last = new Date(lastDate).getTime();
    const next = last + (15 * 24 * 60 * 60 * 1000); // +15 days
    const now = new Date().getTime();
    const diff = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const handleGenerateIA = async () => {
    if (!viewingLead) return;
    setIsGeneratingIA(true);
    try {
      const strategy = await generateLeadStrategy(viewingLead.id);
      setViewingLead({ ...viewingLead, insights: strategy });
      addToast({ title: "Estratégia Gerada", description: "A IA analisou esse lead com sucesso!", type: 'success' });
    } catch {
      addToast({ title: "Erro na IA", description: "Não foi possível gerar a estratégia agora.", type: 'error' });
    } finally {
      setIsGeneratingIA(false);
    }
  };

  const orderedStages = [
    PipelineStage.NOVO,
    PipelineStage.EM_ATENDIMENTO,
    PipelineStage.REUNIAO_AGENDADA,
    PipelineStage.FOLLOW_UP,
    PipelineStage.VENDA_FEITA,
    PipelineStage.FINALIZADO
  ];

  // Configurações de Estilo Neon por Stage
  const getStageStyles = (stage: PipelineStage) => {
    switch (stage) {
      case PipelineStage.NOVO:
        return { border: 'border-blue-500', shadow: 'hover:shadow-blue-500/30', text: 'text-blue-400', bg: 'bg-blue-500/10' };
      case PipelineStage.EM_ATENDIMENTO:
        return { border: 'border-indigo-500', shadow: 'hover:shadow-indigo-500/30', text: 'text-indigo-400', bg: 'bg-indigo-500/10' };
      case PipelineStage.REUNIAO_AGENDADA:
        return { border: 'border-amber-500', shadow: 'hover:shadow-amber-500/30', text: 'text-amber-400', bg: 'bg-amber-500/10' };
      case PipelineStage.FOLLOW_UP:
        return { border: 'border-cyan-500', shadow: 'hover:shadow-cyan-500/30', text: 'text-cyan-400', bg: 'bg-cyan-500/10' };
      case PipelineStage.VENDA_FEITA:
        return { border: 'border-emerald-500', shadow: 'hover:shadow-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      case PipelineStage.FINALIZADO:
        return { border: 'border-rose-500', shadow: 'hover:shadow-rose-500/30', text: 'text-rose-400', bg: 'bg-rose-500/10' };
      default:
        return { border: 'border-zinc-500', shadow: 'hover:shadow-zinc-500/30', text: 'text-zinc-400', bg: 'bg-zinc-500/10' };
    }
  };

  const getStageIcon = (stage: PipelineStage) => {
    switch (stage) {
      case PipelineStage.VENDA_FEITA: return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case PipelineStage.FINALIZADO: return <XCircle className="w-4 h-4 text-rose-400" />;
      case PipelineStage.REUNIAO_AGENDADA: return <Clock className="w-4 h-4 text-amber-400" />;
      default: return <ArrowRight className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-background">
      {/* Scrollbar Custom Style */}
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .dark .custom-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.8);
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 shrink-0 border-b border-white/5 bg-slate-900/10">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight drop-shadow-md">
            Pipeline
          </h2>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 px-4 md:px-6 shadow-[0_0_15px_rgba(30,58,138,0.5)] !bg-none !bg-blue-900 hover:!bg-blue-800 text-white border border-blue-700/50 text-xs md:text-sm"
          size="md"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden md:inline">Novo Lead</span><span className="md:hidden">Novo</span>
        </Button>
      </div>

      {/* Board Scroll Area - Container Flex para ocupar altura total */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-2">
        {/* Grid Container - Altura total explícita */}
        <div className="h-full grid grid-cols-6 gap-3 min-w-[1200px]">
          {orderedStages.map((stage) => {
            const stageLeads = getLeadsByStage(stage);
            const stageTotal = getStageTotal(stage);
            const styles = getStageStyles(stage);

            return (
              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className="flex flex-col h-full rounded-xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm transition-colors overflow-hidden shadow-lg"
              >
                {/* Header da Coluna (Fixo) */}
                <div className="p-3 border-b border-white/5 bg-slate-900/60 backdrop-blur-md shrink-0 z-10">
                  <div className="flex justify-between items-center mb-1.5">
                    <h3 className="font-bold text-xs text-blue-50 uppercase tracking-wider truncate pr-1" title={PipelineStageLabels[stage]}>
                      {PipelineStageLabels[stage]}
                    </h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white/10 ${styles.text} ${styles.bg}`}>
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div className={`h-full opacity-80 w-2/3 ${styles.bg.replace('/10', '')} shadow-[0_0_8px_currentColor] text-${styles.text.split('-')[1]}-500`}></div>
                  </div>
                  <div className={`text-xs font-bold mt-1.5 text-right ${styles.text} drop-shadow-sm font-mono`}>
                    {formatCurrency(stageTotal)}
                  </div>
                </div>

                {/* Área dos Cards - Scrollável Internamente */}
                <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-2">
                  {stageLeads.map((lead) => {
                    const cardStyles = getStageStyles(lead.stage);
                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => openDetail(lead)}
                        className={`
                          group relative 
                          bg-slate-900 
                          p-3 rounded-lg
                          border-l-[3px] ${cardStyles.border} border-y border-r border-slate-800
                          cursor-grab active:cursor-grabbing 
                          transition-all duration-300 ease-out
                          hover:-translate-y-1
                          ${cardStyles.shadow}
                          hover:bg-slate-800
                        `}
                      >
                        {/* Conteúdo Principal */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 pr-1">
                            <h4 className="font-bold text-sm text-white leading-tight truncate drop-shadow-md" title={lead.name}>
                              {lead.name}
                            </h4>
                            <p className="text-[10px] text-blue-200/50 truncate mt-0.5">
                              {lead.company || 'Sem empresa'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                              {getStageIcon(stage)}
                            </div>
                            {lead.automationEnabled && (
                              <div className="text-amber-400" title="Automação de Insights Ativa">
                                <Zap className="w-3 h-3 fill-amber-400" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer do Card */}
                        <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                            {/* Avatar */}
                            <div
                              className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-blue-200 border border-slate-700 shadow-inner"
                              title={`Responsável: ${users.find(u => u.id === lead.ownerId)?.name}`}
                            >
                              {users.find(u => u.id === lead.ownerId)?.name.charAt(0) || '?'}
                            </div>
                            {/* Valor Neon */}
                            <span className={`text-[10px] font-bold font-mono ${cardStyles.text} drop-shadow-[0_0_3px_currentColor]`}>
                              {formatCurrency(lead.value)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(lead); }}
                              className="text-slate-500 hover:text-white transition-colors p-0.5"
                              title="Editar"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {stageLeads.length === 0 && (
                    <div className="h-16 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg opacity-30">
                      <span className="text-[10px] text-slate-500 font-medium">Vazio</span>
                    </div>
                  )}
                  {/* Padding bottom extra para garantir que o último item seja visível no final do scroll */}
                  <div className="h-2"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO/EDIÇÃO - COMPACTO */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formData.id ? "Editar Oportunidade" : "Nova Oportunidade"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Nome do Lead</label>
              <Input placeholder="Ex: João Silva" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Empresa</label>
              <Input placeholder="Empresa" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Email</label>
              <Input placeholder="Email" type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Telefone</label>
              <Input placeholder="Telefone" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 block font-medium">Valor Estimado (R$)</label>
              <Input placeholder="0,00" type="number" value={formData.value || ''} onChange={e => setFormData({ ...formData, value: Number(e.target.value) })} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 block font-medium">Origem</label>
              <Select value={formData.source || LeadSource.FORMULARIO} onChange={e => setFormData({ ...formData, source: e.target.value as LeadSource })}>
                {Object.values(LeadSource).map(s => <option key={s} value={s}>{LeadSourceLabels[s]}</option>)}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 block font-medium">Etapa do Funil</label>
              <Select value={formData.stage || PipelineStage.NOVO} onChange={e => setFormData({ ...formData, stage: e.target.value as PipelineStage })}>
                {Object.values(PipelineStage).map(s => <option key={s} value={s}>{PipelineStageLabels[s]}</option>)}
              </Select>
            </div>
            {currentUser.role === 'admin' && (
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 block font-medium">Responsável</label>
                <Select value={formData.ownerId || ''} onChange={e => setFormData({ ...formData, ownerId: Number(e.target.value) })}>
                  <option value="">Selecione...</option>
                  {users.filter(u => u.role === 'vendedor').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
              </div>
            )}
          </div>

          {/* CAMPOS DE INSIGHTS E AUTOMAÇÃO NO FORMULÁRIO */}
          <div className="space-y-2 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Insights & Melhorias
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                  checked={formData.automationEnabled || false}
                  onChange={e => setFormData({ ...formData, automationEnabled: e.target.checked })}
                />
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                  Ativar Envio Quinzenal
                </span>
              </label>
            </div>
            <Textarea
              placeholder="Descreva aqui os insights estratégicos e melhorias sugeridas para este cliente..."
              value={formData.insights || ''}
              onChange={e => setFormData({ ...formData, insights: e.target.value })}
              className="h-24 bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 focus:ring-indigo-500/20 relative z-10"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-[10px] text-indigo-400/80 italic relative z-10">
                * Automação gera novos insights a cada 15 dias.
              </p>
              {formData.lastInsightDate && (
                <p className="text-[10px] text-indigo-500 font-mono opacity-70">
                  Último: {new Date(formData.lastInsightDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Observações Gerais</label>
            <Textarea placeholder="Detalhes importantes..." value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="h-20" />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button type="submit" className="!bg-none !bg-blue-900 hover:!bg-blue-950 text-white shadow-lg shadow-blue-900/20 border-0">Salvar Lead</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE DETALHES */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalhes do Lead">
        {viewingLead && (
          <div className="space-y-6">
            <div className="flex justify-between items-start bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{viewingLead.name}</h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">{viewingLead.company}</p>
              </div>
              <Badge variant="neutral" className="text-sm px-3 py-1 bg-white dark:bg-zinc-800 shadow-sm">{PipelineStageLabels[viewingLead.stage]}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-200">
                <p className="text-zinc-400 text-xs uppercase font-bold mb-1 tracking-wider">Contato</p>
                <p className="text-zinc-900 dark:text-white font-medium truncate" title={viewingLead.email}>{viewingLead.email || '-'}</p>
              </div>
              <div className="p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-200">
                <p className="text-zinc-400 text-xs uppercase font-bold mb-1 tracking-wider">Telefone</p>
                <p className="text-zinc-900 dark:text-white font-medium">{viewingLead.phone || '-'}</p>
              </div>
              <div className="p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-200">
                <p className="text-zinc-400 text-xs uppercase font-bold mb-1 tracking-wider">Valor</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">R$ {viewingLead.value.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-200">
                <p className="text-zinc-400 text-xs uppercase font-bold mb-1 tracking-wider">Origem</p>
                <div className="inline-block"><Badge variant="default">{LeadSourceLabels[viewingLead.source]}</Badge></div>
              </div>
            </div>

            {/* SEÇÃO DE INSIGHTS E MELHORIAS - VISUALIZAÇÃO */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lightbulb className="w-16 h-16 text-indigo-500" />
              </div>

              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm">Insights & Melhorias Estratégicas</h4>

                <button
                  onClick={handleGenerateIA}
                  disabled={isGeneratingIA}
                  className={`ml-auto p-1.5 rounded-lg transition-all ${isGeneratingIA ? 'animate-pulse bg-indigo-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'}`}
                  title="Gerar Estratégia com IA"
                >
                  {isGeneratingIA ? <Zap className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                </button>

                {viewingLead.automationEnabled ? (
                  <span className="ml-auto text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-200 dark:border-green-800">
                    <Zap className="w-3 h-3" /> Automação Ativa
                  </span>
                ) : (
                  <span className="ml-auto text-[10px] font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                    Inativo
                  </span>
                )}
              </div>

              <div className="relative z-10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-3 rounded-xl border border-white/50 dark:border-zinc-700/50 min-h-[60px]">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {viewingLead.insights || "Nenhum insight estratégico registrado para este lead."}
                </p>
              </div>

              {viewingLead.automationEnabled && (
                <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between text-[10px] font-medium text-indigo-600 dark:text-indigo-300">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>Próximo Relatório em: <strong>{getDaysNextInsight(viewingLead.lastInsightDate)} dias</strong></span>
                  </div>
                  <span className="opacity-70">Ciclo de 15 dias</span>
                </div>
              )}
              {/* Progress Bar for Automation */}
              {viewingLead.automationEnabled && (
                <div className="mt-2 h-1 w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${Math.max(0, Math.min(100, (15 - getDaysNextInsight(viewingLead.lastInsightDate)) / 15 * 100))}%` }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider px-1">observações</p>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[100px]">
                <p className="text-zinc-700 dark:text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{viewingLead.notes || 'Nenhuma observação registrada.'}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <LeadActivityTimeline lead={viewingLead} />
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex gap-3">
                <Button className="flex-1 gap-2 border-green-200 hover:border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900" variant="outline" onClick={copyWhatsApp}><ExternalLink className="w-4 h-4" /> WhatsApp</Button>
                <Button className="flex-1 gap-2 border-blue-200 hover:border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900" variant="outline" onClick={sendFakeMessage}><MessageSquare className="w-4 h-4" /> Script</Button>
              </div>
              {viewingLead.stage !== PipelineStage.VENDA_FEITA && viewingLead.stage !== PipelineStage.FINALIZADO && (
                <div className="flex gap-3 mt-2">
                  <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 border-0" onClick={() => changeDetailStage(PipelineStage.VENDA_FEITA)}>Marcar Ganho</Button>
                  <Button className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/20 border-0" onClick={() => changeDetailStage(PipelineStage.FINALIZADO)}>Finalizar Lead</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Pipeline;
