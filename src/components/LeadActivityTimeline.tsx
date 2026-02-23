
import React from 'react';
import { Lead, PipelineStage, PipelineStageLabels } from '../pages/types';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, FileText, Lightbulb, Star, UserPlus } from 'lucide-react';

interface LeadActivityTimelineProps {
    lead: Lead;
}

const LeadActivityTimeline: React.FC<LeadActivityTimelineProps> = ({ lead }) => {
    // Synthesize events from lead data
    const events = [
        {
            id: 'create',
            type: 'creation',
            date: lead.createdAt,
            title: 'Lead Capturado',
            description: `Origem: ${lead.source.charAt(0).toUpperCase() + lead.source.slice(1)}`,
            icon: UserPlus,
            color: 'bg-blue-500'
        },
        ...(lead.lastInsightDate ? [{
            id: 'insight',
            type: 'insight',
            date: lead.lastInsightDate,
            title: 'IA Gerou Estratégia',
            description: 'Análise de perfil e sugestão de abordagem.',
            icon: Lightbulb,
            color: 'bg-purple-500'
        }] : []),
        ...(lead.notes ? [{
            id: 'note',
            type: 'note',
            date: new Date().toISOString(), // Mock "Recent" date for note
            title: 'Anotação Registrada',
            description: 'Ver observações acima.',
            icon: FileText,
            color: 'bg-amber-500'
        }] : []),
        {
            id: 'current',
            type: 'status',
            date: new Date().toISOString(),
            title: `Estágio: ${PipelineStageLabels[lead.stage]}`,
            description: 'Status atual do funil.',
            icon: Star,
            color: 'bg-emerald-500'
        }
    ];

    // Sort by date descending (newest first)
    const sortedEvents = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="relative pl-4 border-l border-zinc-200 dark:border-zinc-700 space-y-8 my-6">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest absolute -top-8 left-0">
                Histórico de Atividades
            </h4>

            {sortedEvents.map((event, index) => (
                <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                >
                    {/* Dot */}
                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full ${event.color} shadow-[0_0_8px_currentColor] border-2 border-white dark:border-zinc-900`} />

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-400 font-mono">
                            {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="glass-card p-3 rounded-xl hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <event.icon className={`w-4 h-4 ${event.color.replace('bg-', 'text-')}`} />
                                <h5 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{event.title}</h5>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {event.description}
                            </p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default LeadActivityTimeline;
