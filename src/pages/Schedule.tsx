
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { Card, Button, Input, Modal, Select, Badge, Textarea } from '../components/UIComponents';
import {
  Plus, Video, Clock, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, Zap, Trash2, Edit2,
  MapPin, User, CheckCircle2, Globe, Timer, MoreHorizontal, ArrowUpRight
} from 'lucide-react';
import { CalendarEvent } from './types';
import { useToast } from '../contexts/ToastContext';

type ViewMode = 'month' | 'week';

const Schedule: React.FC = () => {
  const { leads, meetings, addMeeting, updateMeeting, deleteMeeting } = useCRM();
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTimeLine, setCurrentTimeLine] = useState(new Date());

  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    summary: '',
    description: '',
    start: { dateTime: '' },
    end: { dateTime: '' },
    location: ''
  });

  // Update current time line every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTimeLine(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => setCurrentDate(new Date());

  const openCreate = (date?: Date, hour?: number) => {
    let startDateTime = '';
    if (date) {
      const d = new Date(date);
      if (hour !== undefined) d.setHours(hour, 0, 0, 0);
      // Salvar em ISO local para o input datetime-local
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      startDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    setFormData({ summary: '', description: '', start: { dateTime: startDateTime }, location: 'Google Meet', leadId: '', meeting_link: '' });
    setIsFormOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    const d = new Date(event.start.dateTime);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const startDateTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setFormData({ ...event, start: { dateTime: startDateTime } });
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  const openDetail = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este agendamento permanentemente?')) {
      await deleteMeeting(id);
      setIsDetailOpen(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    // O input datetime-local retorna string no formato "YYYY-MM-DDTHH:mm" (horário local)
    // Precisamos converter corretamente para ISO string mantendo o horário escolhido
    const startDateTimeLocal = formData.start?.dateTime || '';
    let startISO = new Date().toISOString();
    let endISO = startISO;

    if (startDateTimeLocal) {
      // Criar Date a partir do valor local - o construtor interpreta como horário local
      const startDate = new Date(startDateTimeLocal);
      startISO = startDate.toISOString();

      // Define fim como 1 hora depois do início por padrão
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      endISO = formData.end?.dateTime ? new Date(formData.end.dateTime).toISOString() : endDate.toISOString();
    }

    const eventData = {
      summary: formData.summary || 'Sem Título',
      description: formData.description || '',
      start: { dateTime: startISO },
      end: { dateTime: endISO },
      location: formData.location || '',
      leadId: formData.leadId,
      meeting_link: formData.meeting_link || ''
    };

    if (formData.id) {
      await updateMeeting({ ...eventData, id: formData.id } as CalendarEvent);
    } else {
      await addMeeting(eventData);
    }
    setIsFormOpen(false);
  };

  const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
    }
    return days;
  }, [currentDate]);

  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const hours = Array.from({ length: 24 }).map((_, i) => i); // 00:00 às 23:00

  const todaysMeetingsCount = useMemo(() => {
    const today = new Date().toDateString();
    return meetings.filter(e => new Date(e.start.dateTime).toDateString() === today).length;
  }, [meetings]);

  const getEventForLead = (leadId?: string) => leads.find(l => l.id === leadId);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl shadow-zinc-200/50 dark:shadow-black/20">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/30">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Agenda Executiva
            </h2>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium ml-1 text-sm tracking-wide">Orquestre seus compromissos com precisão cirúrgica.</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 shadow-inner">
            <button
              onClick={() => setViewMode('month')}
              className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${viewMode === 'month' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xl' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${viewMode === 'week' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xl' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
            >
              Semana
            </button>
          </div>
          <Button
            onClick={() => openCreate(new Date())}
            className="px-8 !bg-blue-600 hover:!bg-blue-700 text-white rounded-2xl shadow-2xl shadow-blue-600/20 border-0 font-bold tracking-tight gap-2 !bg-none"
          >
            <Plus className="w-5 h-5" /> Agendar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Widgets - Design Superior */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-6 border-0 shadow-xl bg-white dark:bg-zinc-900 rounded-[2rem]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Prioridades</h3>
              <Badge variant="default" className="!bg-blue-50 !text-blue-600 border-0">Total: {meetings.length}</Badge>
            </div>

            <div className="space-y-4">
              {meetings.length > 0 ? meetings.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  onClick={() => openDetail(event)}
                  className="group p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-800/40 border border-transparent hover:border-blue-500/20 hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase font-mono">
                      {new Date(event.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">{event.summary}</h4>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Online
                    </span>
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-bold text-blue-600">A</div>
                      <div className="w-6 h-6 rounded-full bg-zinc-200 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-500">+</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center">
                  <Clock className="w-8 h-8 text-zinc-200 dark:text-zinc-800 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">Nenhum compromisso.</p>
                </div>
              )}
            </div>
          </Card>

          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-900 text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group">
            <div className="relative z-10">
              <Timer className="w-10 h-10 mb-6 opacity-80" />
              <h4 className="text-xl font-black tracking-tight mb-2">Seu tempo é ouro.</h4>
              <p className="text-sm opacity-80 leading-relaxed font-medium">Você tem {todaysMeetingsCount} reuniões marcadas para hoje.</p>
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">Status: Produtivo</span>
              </div>
            </div>
            <Globe className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10 group-hover:rotate-12 transition-transform duration-1000" />
          </div>
        </div>

        {/* Área do Calendário Principal - Master Piece */}
        <div className="lg:col-span-9">
          <Card className="p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem]">
            {/* Toolbar Customizada */}
            <div className="p-8 border-b border-zinc-50 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/20 dark:bg-zinc-800/10">
              <div className="flex items-center gap-6">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white capitalize tracking-tighter">{monthLabel}</h3>
                <div className="flex items-center bg-white dark:bg-zinc-800 rounded-2xl p-1 shadow-sm border border-zinc-100 dark:border-zinc-700">
                  <button onClick={() => handleNavigate('prev')} className="p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-xl transition-all text-zinc-600 dark:text-zinc-400"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={handleToday} className="px-5 py-1 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-xl text-blue-600 dark:text-blue-400">Hoje</button>
                  <button onClick={() => handleNavigate('next')} className="p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-xl transition-all text-zinc-600 dark:text-zinc-400"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Reunião
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700"></div> Livre
                </div>
              </div>
            </div>

            {viewMode === 'month' ? (
              /* MONTH VIEW - REFINED */
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="grid grid-cols-7 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/30">
                  {weekDayLabels.map(day => (
                    <div key={day} className="py-4 text-center text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {monthDays.map((item, i) => {
                    const isToday = item.date.toDateString() === new Date().toDateString();
                    const dayEvents = meetings.filter(e => new Date(e.start.dateTime).toDateString() === item.date.toDateString());

                    return (
                      <div
                        key={i}
                        onClick={() => openCreate(item.date)}
                        className={`min-h-[140px] p-4 border-r border-b border-zinc-50 dark:border-zinc-800/50 last:border-r-0 relative group hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all cursor-pointer ${!item.currentMonth ? 'opacity-20 grayscale' : ''}`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-xs font-black tracking-tighter ${isToday ? 'bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-xl shadow-xl shadow-indigo-500/40' : 'text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
                            {item.day}
                          </span>
                        </div>
                        <div className="space-y-1.5 overflow-hidden">
                          {dayEvents.map(e => (
                            <div
                              key={e.id}
                              onClick={(evt) => { evt.stopPropagation(); openDetail(e); }}
                              className="text-[9px] font-bold p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 truncate rounded-xl border-l-[3px] border-blue-500 hover:scale-[1.02] transition-all shadow-sm"
                            >
                              {e.summary}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* WEEK VIEW - LUXURY EDITION */
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 sticky top-0 z-20 backdrop-blur-md">
                  <div className="p-4"></div>
                  {weekDays.map(day => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <div key={day.toISOString()} className="py-6 text-center border-l border-zinc-100/30 dark:border-zinc-800/30">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">{weekDayLabels[day.getDay()]}</p>
                        <p className={`text-xl font-black mt-1 tracking-tighter ${isToday ? 'text-indigo-600 scale-110' : 'text-zinc-900 dark:text-white'}`}>{day.getDate()}</p>
                        {isToday && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mx-auto mt-2 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>}
                      </div>
                    );
                  })}
                </div>
                <div className="overflow-y-auto max-h-[700px] bg-white dark:bg-zinc-900 custom-scroll relative">
                  {/* Time Indicator Line */}
                  {weekDays.some(d => d.toDateString() === new Date().toDateString()) && (
                    <div
                      className="absolute left-[100px] right-0 z-10 pointer-events-none"
                      style={{
                        top: `${(currentTimeLine.getHours() - 7) * 80 + (currentTimeLine.getMinutes() / 60) * 80}px`
                      }}
                    >
                      <div className="w-full border-t-2 border-red-500/40 relative">
                        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                      </div>
                    </div>
                  )}

                  {hours.map(hour => (
                    <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] min-h-[80px] border-b border-zinc-50/50 dark:border-zinc-800/50 group">
                      <div className="p-4 text-[10px] font-black text-zinc-300 dark:text-zinc-600 text-right uppercase tracking-[0.1em] border-r border-zinc-50/50 dark:border-zinc-800/50 flex flex-col justify-start">
                        <span>{hour.toString().padStart(2, '0')}:00</span>
                        <span className="text-[8px] opacity-40 mt-1">{hour >= 12 ? 'PM' : 'AM'}</span>
                      </div>
                      {weekDays.map(day => {
                        const hourEvents = meetings.filter(e => {
                          const d = new Date(e.start.dateTime);
                          // Comparar data e hora (ignorando minutos e segundos para encaixar no slot da hora)
                          const sameDay = d.getFullYear() === day.getFullYear() &&
                            d.getMonth() === day.getMonth() &&
                            d.getDate() === day.getDate();
                          return sameDay && d.getHours() === hour;
                        });
                        return (
                          <div
                            key={day.toISOString()}
                            onClick={() => openCreate(day, hour)}
                            className="border-l border-zinc-100/30 dark:border-zinc-800/50 p-1 relative hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group/slot min-h-[100px]"
                          >
                            {hourEvents.map(e => (
                              <div
                                key={e.id}
                                onClick={(evt) => { evt.stopPropagation(); openDetail(e); }}
                                className="absolute inset-1 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/30 p-2 z-10 shadow-sm backdrop-blur-sm group/event hover:scale-[1.02] transition-all hover:shadow-lg hover:shadow-blue-500/10 border-l-[4px] border-l-blue-600"
                              >
                                <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 leading-tight uppercase mb-1 truncate">{e.summary}</p>
                                <div className="flex items-center gap-1.5 opacity-80">
                                  <div className="w-3 h-3 rounded-full bg-blue-600 flex items-center justify-center">
                                    <Video className="w-2 h-2 text-white" />
                                  </div>
                                  <span className="text-[8px] font-black text-blue-600/80 uppercase tracking-tighter">Meeting</span>
                                </div>
                              </div>
                            ))}
                            {/* Indicator for hover */}
                            <div className="absolute inset-0 opacity-0 group-hover/slot:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                              <Plus className="w-4 h-4 text-zinc-200 dark:text-zinc-800" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* MODAL DE DETALHES - DESIGN DE ALTO NÍVEL */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Evento Estratégico">
        {selectedEvent && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="relative p-8 rounded-[2rem] bg-gradient-to-br from-blue-600 to-cyan-700 text-white overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <Badge variant="success" className="!bg-white/20 !text-white border-white/30 backdrop-blur-md font-black uppercase text-[9px] tracking-widest px-4 py-1.5">CONFIRMADO</Badge>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(selectedEvent)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(selectedEvent.id)} className="p-2.5 bg-red-500/20 hover:bg-red-500/40 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="text-3xl font-black tracking-tight leading-tight mb-4">{selectedEvent.summary}</h3>
                <div className="flex items-center gap-4 text-white/90 font-bold text-xs uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(selectedEvent.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(selectedEvent.start.dateTime).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </div>
                </div>
              </div>
              <Zap className="absolute -right-12 -bottom-12 w-64 h-64 text-white opacity-10 rotate-12" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 shadow-sm group hover:border-blue-500/30 transition-all">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">CONFERÊNCIA</p>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-zinc-700 rounded-2xl shadow-sm text-blue-600">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    {(selectedEvent.meeting_link || (selectedEvent.location && (selectedEvent.location.includes('http') || selectedEvent.location.includes('meet.google.com')))) ? (
                      <a
                        href={(selectedEvent.meeting_link || selectedEvent.location).startsWith('http') ? (selectedEvent.meeting_link || selectedEvent.location) : `https://${selectedEvent.meeting_link || selectedEvent.location}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-black text-sm block text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline truncate max-w-[200px]"
                        title="Clique para abrir a reunião"
                      >
                        {selectedEvent.location || 'Acessar Link'}
                      </a>
                    ) : (
                      <span className="font-black text-sm block text-zinc-900 dark:text-white truncate max-w-[200px]" title={selectedEvent.location}>{selectedEvent.location || 'Meet Room'}</span>
                    )}

                    {(selectedEvent.meeting_link || (selectedEvent.location && (selectedEvent.location.includes('http') || selectedEvent.location.includes('meet.google.com')))) ? (
                      <a
                        href={(selectedEvent.meeting_link || selectedEvent.location).startsWith('http') ? (selectedEvent.meeting_link || selectedEvent.location) : `https://${selectedEvent.meeting_link || selectedEvent.location}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 uppercase cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all flex items-center gap-1.5 mt-3 w-fit shadow-md shadow-blue-500/10 animate-bounce-subtle"
                      >
                        <Video className="w-3 h-3" /> Entrar na Sala <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Link não disponível</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedEvent.leadId && (
                <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 shadow-sm group hover:border-blue-500/30 transition-all">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">INTERLOCUTOR</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-black text-xl border border-blue-200 dark:border-blue-800">
                      {getEventForLead(selectedEvent.leadId)?.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-black text-sm block text-zinc-900 dark:text-white">{getEventForLead(selectedEvent.leadId)?.name}</span>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{getEventForLead(selectedEvent.leadId)?.company}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">PAUTA E NOTAS</p>
              <div className="p-8 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 italic text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed shadow-inner">
                {selectedEvent.description || 'Agenda técnica sem notas adicionais cadastradas.'}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-zinc-50 dark:border-zinc-800">
              <Button variant="ghost" onClick={() => setIsDetailOpen(false)} className="rounded-xl px-8 font-bold text-zinc-500">Fechar</Button>
              <Button className="!bg-blue-600 hover:!bg-blue-700 text-white gap-2 border-0 rounded-2xl px-10 font-bold shadow-xl shadow-blue-600/20">
                <CheckCircle2 className="w-5 h-5" /> Concluir Reunião
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* FORMULÁRIO DE CRIAÇÃO - DESIGN CLEAN */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formData.id ? "Ajustar Agenda" : "Novo Compromisso"}>
        <form onSubmit={handleSaveEvent} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Assunto da Reunião</label>
            <Input
              placeholder="Ex: Alinhamento de Metas"
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
              required
              className="rounded-2xl h-14 !bg-zinc-50 dark:!bg-zinc-950/50 border-zinc-100 dark:border-zinc-800 focus:border-blue-500 font-extrabold text-lg placeholder:font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Data e Hora</label>
              <Input
                type="datetime-local"
                value={formData.start?.dateTime}
                onChange={e => setFormData({ ...formData, start: { dateTime: e.target.value } })}
                required
                className="rounded-2xl !bg-zinc-50 dark:!bg-zinc-950/50 border-zinc-100 dark:border-zinc-800 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Duração Est.</label>
              <Select className="rounded-2xl !bg-zinc-50 dark:!bg-zinc-950/50 border-zinc-100 dark:border-zinc-800 font-bold h-[42px]">
                <option>30 minutos</option>
                <option>1 hora</option>
                <option>2 horas</option>
                <option>Workshop (4h)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Plataforma / Local</label>
            <Input
              placeholder="Google Meet, Zoom ou Endereço"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="rounded-2xl !bg-zinc-50 dark:!bg-zinc-950/50 border-zinc-100 dark:border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Link da Reunião (Meet/Zoom)</label>
            <Input
              placeholder="https://meet.google.com/..."
              value={formData.meeting_link}
              onChange={e => setFormData({ ...formData, meeting_link: e.target.value })}
              className="rounded-2xl !bg-zinc-50 dark:!bg-zinc-950/50 border-zinc-100 dark:border-zinc-800 focus:border-blue-500 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Vincular Cliente (Lead)</label>
            <Select
              value={formData.leadId}
              onChange={e => setFormData({ ...formData, leadId: e.target.value })}
              className="rounded-2xl !bg-zinc-50 dark:!bg-zinc-950/50 border-zinc-100 dark:border-zinc-800 font-bold"
            >
              <option value="">Nenhum lead selecionado</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.company}</option>)}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Notas e Objetivos</label>
            <Textarea
              placeholder="Qual o objetivo principal desta reunião?"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="h-32 rounded-3xl !bg-zinc-50 dark:!bg-zinc-950/50 border-zinc-100 dark:border-zinc-800 resize-none font-medium p-4"
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-zinc-50 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="rounded-xl px-6 font-bold">Cancelar</Button>
            <Button
              type="submit"
              className="px-10 !bg-blue-600 hover:!bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-600/20 border-0"
            >
              {formData.id ? 'Atualizar Compromisso' : 'Confirmar Agenda'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Schedule;
