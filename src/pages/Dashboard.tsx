
import React, { useMemo, useState } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { Card } from '../components/UIComponents';
import { PeriodFilter, PipelineStage } from './types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Trophy, DollarSign, Activity, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{entry.name}</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { leads, meetings } = useCRM();
  const [period, setPeriod] = useState<PeriodFilter>('30days');
  const { isDarkMode } = useTheme();

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads;
  }, [leads, period]);

  const chartData = useMemo(() => {
    if (!filteredLeads.length) return [];

    const groups: Record<string, number> = {};
    const now = new Date();
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 365;

    // Initialize with zeros
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      groups[key] = 0;
    }

    filteredLeads.forEach(lead => {
      const date = new Date(lead.createdAt);
      const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (groups[key] !== undefined) {
        groups[key]++;
      }
    });

    return Object.entries(groups).map(([name, value]) => ({ name, leads: value }));
  }, [filteredLeads, period]);

  const kpis = useMemo(() => {
    const total = filteredLeads.length;
    const won = filteredLeads.filter(l => l.stage === PipelineStage.VENDA_FEITA);
    const revenue = won.reduce((acc, curr) => acc + curr.value, 0);
    const conv = total > 0 ? (won.length / total) * 100 : 0;

    return [
      { label: 'Leads Ativos', value: total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
      { label: 'Taxa Conversão', value: `${conv.toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
      { label: 'Vendas Fechadas', value: won.length, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
      { label: 'Receita Total', value: `R$ ${revenue.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    ];
  }, [filteredLeads]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-normal">Painel Executivo</h2>
          <p className="text-zinc-500 text-sm">Visão geral do desempenho comercial.</p>
        </div>
        <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl flex border border-zinc-200 dark:border-zinc-700">
          {['7days', '30days', 'total'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as PeriodFilter)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${period === p ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              {p === '7days' ? 'Semana' : p === '30days' ? 'Mês' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className={`p-6 border ${kpi.border} bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 hover:-translate-y-1 transition-all duration-300 group`}>
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <span className="text-[10px] font-black text-emerald-500 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/10"><ArrowUpRight className="w-3 h-3" /> +12%</span>
            </div>
            <div className="mt-5">
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-normal leading-none">{kpi.value}</h3>
              <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-2">{kpi.label}</p>
            </div>
            {/* Subtle Gradient Line */}
            <div className={`h-1 w-full mt-6 rounded-full opacity-20 ${kpi.bg.replace('/10', '')}`}></div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white">Tração de Novos Leads</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Histórico diário de entrada de leads</p>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f4f4f5'} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#71717a', fontWeight: '800' }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#71717a', fontWeight: '800' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }} />
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="Entrada de Leads"
                  stroke="#6366f1"
                  fill="url(#colorLeads)"
                  strokeWidth={4}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col">
          <div className="mb-8">
            <h3 className="font-bold text-zinc-900 dark:text-white">Performance de Metas</h3>
            <p className="text-[10px] text-zinc-500 font-medium">Progresso em relação aos objetivos mensais</p>
          </div>

          <div className="flex-1 space-y-8">
            {[
              { label: 'Novos Leads', current: leads.length, target: 100, color: 'bg-indigo-600', text: 'text-indigo-600' },
              { label: 'Reuniões Agendadas', current: meetings.length, target: 50, color: 'bg-amber-500', text: 'text-amber-500' },
              { label: 'Vendas Fechadas', current: leads.filter(l => l.stage === PipelineStage.VENDA_FEITA).length, target: 20, color: 'bg-emerald-500', text: 'text-emerald-500' }
            ].map(meta => (
              <div key={meta.label} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{meta.label}</span>
                    <p className={`text-sm font-black ${meta.text}`}>{meta.current} de {meta.target}</p>
                  </div>
                  <span className="text-xs font-black text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">{Math.round((meta.current / meta.target) * 100)}%</span>
                </div>
                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-inner">
                  <div className={`h-full ${meta.color} bg-gradient-to-r from-transparent to-white/20 transition-all duration-1000 shadow-[0_0_12px_rgba(255,255,255,0.1)]`} style={{ width: `${Math.min((meta.current / meta.target) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-center">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Insights IA</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Sua conversão subiu 5% desde ontem.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

