
export type Role = 'admin' | 'vendedor';

export interface User {
  id: number;
  authUserId: string;
  name: string;
  email: string;
  role: Role;
  companyId: number;
  isActive: boolean;
  avatarUrl?: string;
}

export enum PipelineStage {
  NOVO = 'novo_lead',
  EM_ATENDIMENTO = 'em_atendimento',
  REUNIAO_AGENDADA = 'reuniao_marcada',
  VENDA_FEITA = 'venda_feita',
  FOLLOW_UP = 'follow_up',
  FINALIZADO = 'perdido',
}

export const PipelineStageLabels: Record<PipelineStage, string> = {
  [PipelineStage.NOVO]: 'Novo Lead',
  [PipelineStage.EM_ATENDIMENTO]: 'Em Atendimento',
  [PipelineStage.REUNIAO_AGENDADA]: 'Reunião Marcada',
  [PipelineStage.VENDA_FEITA]: 'Venda Feita',
  [PipelineStage.FOLLOW_UP]: 'Follow-up',
  [PipelineStage.FINALIZADO]: 'Finalizado',
};

export enum LeadSource {
  FORMULARIO = 'formulario',
  WHATSAPP = 'whatsapp',
  REDES_SOCIAIS = 'redes_sociais',
  INDICACAO = 'indicacao',
  OUTROS = 'outros',
}

export const LeadSourceLabels: Record<LeadSource, string> = {
  [LeadSource.FORMULARIO]: 'Formulário',
  [LeadSource.WHATSAPP]: 'WhatsApp',
  [LeadSource.REDES_SOCIAIS]: 'Redes Sociais',
  [LeadSource.INDICACAO]: 'Indicação',
  [LeadSource.OUTROS]: 'Outros',
};

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: LeadSource;
  value: number;
  createdAt: string;
  stage: PipelineStage;
  ownerId: number;
  notes: string;
  companyId: number;
  insights?: string;
  automationEnabled?: boolean;
  lastInsightDate?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  location?: string;
  leadId?: string;
  meeting_link?: string;
  userId?: number;
}

export type PeriodFilter = 'today' | '7days' | '30days' | 'total';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
