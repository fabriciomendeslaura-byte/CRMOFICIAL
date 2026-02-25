
import React, { useState, useEffect } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { useToast } from '../contexts/ToastContext';
import { Card, Button, Input, Modal, Select, Textarea, Badge } from '../components/UIComponents';
import { Lead, LeadSource, PipelineStage, PipelineStageLabels, LeadSourceLabels } from './types';
import { Search, Plus, Download, Trash2, Edit2, Eye, MessageSquare, ExternalLink, Filter, Lightbulb, Zap, Calendar } from 'lucide-react';

const Leads: React.FC = () => {
  const { leads, currentUser, users, addLead, updateLead, deleteLead, exportCSV, isLoading } = useCRM();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Partial<Lead> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n') {
        e.preventDefault();
        openCreate();
      }
      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('search-leads')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredLeads = leads.filter(l => {
    return l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const openCreate = () => {
    setEditingLead({
      source: LeadSource.FORMULARIO,
      stage: PipelineStage.NOVO,
      ownerId: currentUser.role === 'vendedor' ? currentUser.id : undefined,
      automationEnabled: false,
      insights: '',
      lastInsightDate: new Date().toISOString()
    });
    setIsFormOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead({ ...lead });
    setIsFormOpen(true);
  };

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead?.name || !editingLead?.value) return;

    if (editingLead.id) {
      updateLead(editingLead as Lead);
    } else {
      addLead({
        name: editingLead.name,
        company: editingLead.company || '',
        email: editingLead.email || '',
        phone: editingLead.phone || '',
        source: editingLead.source || LeadSource.FORMULARIO,
        value: Number(editingLead.value) || 0,
        stage: editingLead.stage || PipelineStage.NOVO,
        ownerId: editingLead.ownerId || currentUser.id,
        notes: editingLead.notes || '',
        insights: editingLead.insights || '',
        automationEnabled: editingLead.automationEnabled || false,
        lastInsightDate: editingLead.lastInsightDate || new Date().toISOString()
      });
    }
    setIsFormOpen(false);
    setEditingLead(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique propague para outros elementos (como a linha da tabela)
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      deleteLead(id);
    }
  };

  const copyWhatsApp = () => {
    navigator.clipboard.writeText(`https://wa.me/${selectedLead?.phone}`);
    addToast({ title: "Link Copiado", description: "Link do WhatsApp na área de transferência", type: 'success' });
  };

  const sendFakeMessage = () => {
    addToast({ title: "Mensagem enviada", description: `Olá ${selectedLead?.name}, como podemos ajudar?`, type: 'success' });
  };

  const changeDetailStage = (stage: PipelineStage) => {
    if (selectedLead) {
      updateLead({ ...selectedLead, stage });
      setSelectedLead({ ...selectedLead, stage });
    }
  };

  const getDaysNextInsight = (lastDate?: string) => {
    if (!lastDate) return 0;
    const last = new Date(lastDate).getTime();
    const next = last + (15 * 24 * 60 * 60 * 1000); // +15 days
    const now = new Date().getTime();
    const diff = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getStageVariant = (stage: PipelineStage) => {
    switch (stage) {
      case PipelineStage.VENDA_FEITA: return 'success';
      case PipelineStage.FINALIZADO: return 'error';
      case PipelineStage.REUNIAO_AGENDADA: return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-normal">Leads</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Gerencie sua base de contatos e clientes em potencial.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => exportCSV(filteredLeads)} disabled={isLoading} className="shadow-sm justify-center">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <Button
            onClick={openCreate}
            disabled={isLoading}
            className="shadow-[0_0_15px_rgba(30,58,138,0.5)] !bg-none !bg-blue-900 hover:!bg-blue-800 text-white border border-blue-700/50 justify-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Lead
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-xl shadow-zinc-200/40 dark:shadow-black/20">
        {/* Search Bar inside Card */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4 bg-white dark:bg-zinc-900">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              id="search-leads"
              placeholder="Buscar por nome, empresa ou email..."
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-0 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:flex text-zinc-500">
            <Filter className="w-4 h-4 mr-2" /> Filtros Avançados
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs font-semibold border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">Lead</th>
                <th className="px-6 py-4 hidden md:table-cell">Contato</th>
                <th className="px-6 py-4 hidden sm:table-cell">Status</th>
                <th className="px-6 py-4 hidden lg:table-cell">Insights</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50 bg-white dark:bg-zinc-900/40">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm shrink-0">
                          {lead.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="font-semibold text-zinc-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                            onClick={() => openDetail(lead)}
                          >
                            {lead.name}
                          </div>
                          <div className="text-zinc-500 text-xs truncate max-w-[120px]">{lead.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[150px]">{lead.email}</span>
                        <span className="text-xs text-zinc-400">{lead.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <Badge variant={getStageVariant(lead.stage)}>
                        {PipelineStageLabels[lead.stage]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {lead.automationEnabled ? (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md w-fit" title="Automação Ativa">
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span className="text-xs font-semibold">Ativo</span>
                        </div>
                      ) : lead.insights ? (
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400" title="Possui insights manuais">
                          <Lightbulb className="w-4 h-4" />
                          <span className="text-xs">Manual</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">R$ {lead.value.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <Button size="sm" variant="ghost" onClick={() => openDetail(lead)} className="h-8 w-8 p-0 rounded-full">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(lead)} className="h-8 w-8 p-0 rounded-full">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {(currentUser.role === 'admin' || currentUser.id === lead.ownerId) && (
                          <Button size="sm" variant="ghost" onClick={(e) => handleDelete(lead.id, e)} className="h-8 w-8 p-0 rounded-full text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-full">
                        <Search className="w-6 h-6 opacity-30" />
                      </div>
                      <p className="font-medium">Nenhum lead encontrado.</p>
                      <p className="text-xs max-w-xs mx-auto opacity-70">Tente ajustar seus filtros ou crie um novo lead para começar.</p>
                      <Button variant="outline" size="sm" onClick={openCreate} className="mt-2">Criar Lead</Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalhes do Lead">
        {selectedLead && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{selectedLead.name}</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">{selectedLead.company}</p>
                </div>
              </div>
              <Badge variant={getStageVariant(selectedLead.stage)} className="text-sm px-3">{PipelineStageLabels[selectedLead.stage]}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-50 dark:bg-zinc-800/30 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div><p className="text-zinc-400 font-semibold text-xs uppercase mb-1">Email</p><p className="text-zinc-900 dark:text-white font-medium break-all">{selectedLead.email}</p></div>
              <div><p className="text-zinc-400 font-semibold text-xs uppercase mb-1">Telefone</p><p className="text-zinc-900 dark:text-white font-medium">{selectedLead.phone}</p></div>
              <div><p className="text-zinc-400 font-semibold text-xs uppercase mb-1">Valor</p><p className="text-emerald-600 dark:text-emerald-400 font-bold text-base">R$ {selectedLead.value.toLocaleString()}</p></div>
              <div><p className="text-zinc-400 font-semibold text-xs uppercase mb-1">Origem</p><p className="text-zinc-900 dark:text-white">{LeadSourceLabels[selectedLead.source]}</p></div>
              <div><p className="text-zinc-400 font-semibold text-xs uppercase mb-1">Responsável</p><p className="text-zinc-900 dark:text-white">{users.find(u => u.id === selectedLead.ownerId)?.name}</p></div>
              <div><p className="text-zinc-400 font-semibold text-xs uppercase mb-1">Criado em</p><p className="text-zinc-900 dark:text-white">{new Date(selectedLead.createdAt).toLocaleDateString()}</p></div>
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

                {selectedLead.automationEnabled ? (
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
                  {selectedLead.insights || "Nenhum insight estratégico registrado para este lead."}
                </p>
              </div>

              {selectedLead.automationEnabled && (
                <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between text-[10px] font-medium text-indigo-600 dark:text-indigo-300">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>Próximo Relatório em: <strong>{getDaysNextInsight(selectedLead.lastInsightDate)} dias</strong></span>
                  </div>
                  <span className="opacity-70">Ciclo de 15 dias</span>
                </div>
              )}
              {/* Progress Bar for Automation */}
              {selectedLead.automationEnabled && (
                <div className="mt-2 h-1 w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${Math.max(0, Math.min(100, (15 - getDaysNextInsight(selectedLead.lastInsightDate)) / 15 * 100))}%` }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider px-1">Observações</p>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <p className="text-zinc-700 dark:text-zinc-300 text-sm whitespace-pre-wrap">{selectedLead.notes || 'Sem observações.'}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex gap-3">
                <Button className="flex-1 gap-2 border-green-200 hover:border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900" variant="outline" onClick={copyWhatsApp}><ExternalLink className="w-4 h-4" /> WhatsApp</Button>
                <Button className="flex-1 gap-2 border-blue-200 hover:border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900" variant="outline" onClick={sendFakeMessage}><MessageSquare className="w-4 h-4" /> Script</Button>
              </div>
              <div className="flex gap-3 mt-1">
                <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 border-0" onClick={() => changeDetailStage(PipelineStage.VENDA_FEITA)}>Ganho</Button>
                <Button className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/20 border-0" onClick={() => changeDetailStage(PipelineStage.FINALIZADO)}>Finalizar</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingLead?.id ? 'Editar Lead' : 'Novo Lead'}>
        <form onSubmit={handleSave} className="space-y-4">
          {/* FORMULÁRIO DE EDIÇÃO */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Nome Completo</label>
              <Input placeholder="Ex: Maria Souza" value={editingLead?.name || ''} onChange={e => setEditingLead(p => ({ ...p, name: e.target.value }))} required className="font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Empresa</label>
              <Input placeholder="Empresa" value={editingLead?.company || ''} onChange={e => setEditingLead(p => ({ ...p, company: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Email</label>
              <Input placeholder="Email" type="email" value={editingLead?.email || ''} onChange={e => setEditingLead(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">Telefone</label>
              <Input placeholder="Telefone" value={editingLead?.phone || ''} onChange={e => setEditingLead(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 block">Valor (R$)</label>
              <Input placeholder="0,00" type="number" value={editingLead?.value || ''} onChange={e => setEditingLead(p => ({ ...p, value: Number(e.target.value) }))} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 block">Origem</label>
              <Select value={editingLead?.source || LeadSource.FORMULARIO} onChange={e => setEditingLead(p => ({ ...p, source: e.target.value as LeadSource }))}>
                {Object.values(LeadSource).map(s => <option key={s} value={s}>{LeadSourceLabels[s]}</option>)}
              </Select>
            </div>
          </div>

          {/* CAMPOS DE INSIGHTS - MOVIDO PARA CIMA */}
          <div className="space-y-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 relative overflow-hidden ring-2 ring-indigo-500/10">
            <div className="flex items-center justify-between relative z-10">
              <label className="text-sm font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" /> Insights & Melhorias
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-zinc-800 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                  checked={editingLead?.automationEnabled || false}
                  onChange={e => setEditingLead(p => ({ ...p, automationEnabled: e.target.checked }))}
                />
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
                  Automação 15 Dias
                </span>
              </label>
            </div>
            <Textarea
              placeholder="Descreva aqui os insights estratégicos para o cliente..."
              value={editingLead?.insights || ''}
              onChange={e => setEditingLead(p => ({ ...p, insights: e.target.value }))}
              className="h-28 bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 focus:ring-indigo-500/20 relative z-10 font-medium"
            />
            {editingLead?.automationEnabled && (
              <div className="flex items-center gap-2 mt-1 relative z-10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold">
                  Sistema gerando insights automaticamente a cada ciclo.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 block">Status</label>
              <Select value={editingLead?.stage || PipelineStage.NOVO} onChange={e => setEditingLead(p => ({ ...p, stage: e.target.value as PipelineStage }))}>
                {Object.values(PipelineStage).map(s => <option key={s} value={s}>{PipelineStageLabels[s]}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 block">Responsável</label>
              <Select
                value={editingLead?.ownerId || ''}
                onChange={e => setEditingLead(p => ({ ...p, ownerId: Number(e.target.value) }))}
                disabled={currentUser.role === 'vendedor'}
              >
                <option value="">Responsável</option>
                {users.filter(u => u.role === 'vendedor').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Observações Gerais</label>
            <Textarea placeholder="Detalhes..." value={editingLead?.notes || ''} onChange={e => setEditingLead(p => ({ ...p, notes: e.target.value }))} className="h-20" />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button type="submit" className="!bg-none !bg-blue-900 hover:!bg-blue-950 text-white shadow-lg shadow-blue-900/20 border-0">Salvar Lead</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leads;

