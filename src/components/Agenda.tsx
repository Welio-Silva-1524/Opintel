import { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  AlertTriangle,
  LayoutGrid,
  List as ListIcon,
  X
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfDay,
  endOfDay,
  startOfQuarter,
  endOfQuarter,
  eachMonthOfInterval,
  addQuarters,
  subQuarters,
  addYears,
  subYears,
  startOfYear,
  endOfYear,
  isWithinInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Demand, DemandPriority } from '../types';

interface AgendaProps {
  demands: Demand[];
}

type ViewMode = 'day' | 'month' | 'quarter' | 'semester' | 'year';

export default function Agenda({ demands }: AgendaProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);

  const filteredDemands = useMemo(() => {
    return demands.map(d => ({
      ...d,
      date: d.deadline ? new Date(d.deadline) : new Date(d.createdAt)
    }));
  }, [demands]);

  const handleNext = () => {
    switch (viewMode) {
      case 'day': setCurrentDate(prev => new Date(prev.setDate(prev.getDate() + 1))); break;
      case 'month': setCurrentDate(prev => addMonths(prev, 1)); break;
      case 'quarter': setCurrentDate(prev => addQuarters(prev, 1)); break;
      case 'semester': setCurrentDate(prev => addMonths(prev, 6)); break;
      case 'year': setCurrentDate(prev => addYears(prev, 1)); break;
    }
  };

  const handlePrev = () => {
    switch (viewMode) {
      case 'day': setCurrentDate(prev => new Date(prev.setDate(prev.getDate() - 1))); break;
      case 'month': setCurrentDate(prev => subMonths(prev, 1)); break;
      case 'quarter': setCurrentDate(prev => subQuarters(prev, 1)); break;
      case 'semester': setCurrentDate(prev => subMonths(prev, 6)); break;
      case 'year': setCurrentDate(prev => subYears(prev, 1)); break;
    }
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'day': return format(currentDate, "dd 'de' MMMM yyyy", { locale: ptBR });
      case 'month': return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      case 'quarter': return `Trimestre: ${format(currentDate, 'yyyy')}`;
      case 'semester': return `Semestre: ${format(currentDate, 'yyyy')}`;
      case 'year': return format(currentDate, 'yyyy');
    }
  };

  const renderViewContent = () => {
    switch (viewMode) {
      case 'day':
        return renderDayView();
      case 'month':
        return renderMonthView();
      case 'quarter':
        return renderIntervalView(3);
      case 'semester':
        return renderIntervalView(6);
      case 'year':
        return renderIntervalView(12);
    }
  };

  const renderDayView = () => {
    const dayDemands = filteredDemands.filter(d => isSameDay(d.date, currentDate));
    return (
      <div className="space-y-4 min-h-[400px]">
        {dayDemands.length > 0 ? dayDemands.map(demand => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={demand.id} 
            onClick={() => setSelectedDemand(demand)}
            className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-between hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                demand.priority === DemandPriority.CRITICA ? "bg-red-50 text-red-500" :
                demand.priority === DemandPriority.ALTA ? "bg-orange-50 text-orange-500" :
                "bg-blue-50 text-blue-500"
              )}>
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-[#141414] group-hover:text-black">{demand.title}</h4>
                <p className="text-xs text-[#6B7280]">{demand.sector} • {demand.protocol}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider",
                demand.priority === DemandPriority.CRITICA ? "bg-red-100 text-red-700" :
                demand.priority === DemandPriority.ALTA ? "bg-orange-100 text-orange-700" :
                "bg-blue-100 text-blue-700"
              )}>
                {demand.priority}
              </span>
              <p className="text-[10px] text-[#9CA3AF] mt-1">{demand.assignedTo || 'Não atribuído'}</p>
            </div>
          </motion.div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center text-[#9CA3AF] py-20">
            <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">Nenhuma demanda para este dia.</p>
          </div>
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    });

    return (
      <div className="grid grid-cols-7 gap-px bg-[#E5E7EB] border border-[#E5E7EB] rounded-2xl overflow-hidden">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="bg-[#F9FAFB] p-4 text-center border-b border-[#E5E7EB]">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">{day}</span>
          </div>
        ))}
        {days.map((day, idx) => {
          const dayDemands = filteredDemands.filter(d => isSameDay(d.date, day));
          return (
            <div 
              key={idx} 
              className={cn(
                "bg-white min-h-[120px] p-2 transition-colors hover:bg-[#F9FAFB] cursor-pointer relative",
                !isSameMonth(day, currentDate) && "opacity-30",
                isSameDay(day, new Date()) && "ring-2 ring-inset ring-[#141414] z-10"
              )}
            >
              <span className={cn(
                "text-sm font-bold block mb-2 px-2 py-1 rounded-lg w-8 h-8 flex items-center justify-center",
                isSameDay(day, new Date()) ? "text-[#141414] bg-[#F3F4F6]" : "text-[#141414]"
              )}>
                {format(day, 'd')}
              </span>
              
              <div className="space-y-1">
                {dayDemands.slice(0, 3).map(demand => (
                  <div 
                    key={demand.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDemand(demand);
                    }}
                    className={cn(
                      "text-[9px] font-bold px-2 py-1 rounded-md border-l-2 truncate shadow-sm hover:brightness-95 transition-all cursor-pointer",
                      demand.priority === DemandPriority.CRITICA ? "bg-red-50 text-red-700 border-red-500" :
                      demand.priority === DemandPriority.ALTA ? "bg-orange-50 text-orange-700 border-orange-500" :
                      "bg-blue-50 text-blue-700 border-blue-500"
                    )}
                  >
                    {demand.title}
                  </div>
                ))}
                {dayDemands.length > 3 && (
                  <p className="text-[8px] text-[#9CA3AF] px-1 font-bold">+{dayDemands.length - 3} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderIntervalView = (months: number) => {
    let start, end;
    if (months === 3) {
      start = startOfQuarter(currentDate);
      end = endOfQuarter(currentDate);
    } else if (months === 6) {
      const month = currentDate.getMonth();
      const semesterStartMonth = month < 6 ? 0 : 6;
      start = new Date(currentDate.getFullYear(), semesterStartMonth, 1);
      end = lastDayOfMonth(new Date(currentDate.getFullYear(), semesterStartMonth + 5, 1));
    } else {
      start = startOfYear(currentDate);
      end = endOfYear(currentDate);
    }

    const intervalMonths = eachMonthOfInterval({ start, end });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {intervalMonths.map((month, idx) => {
          const monthDemands = filteredDemands.filter(d => isSameMonth(d.date, month));
          return (
            <div key={idx} className="bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-[#141414] capitalize">{format(month, 'MMMM', { locale: ptBR })}</h4>
                <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-full text-[#6B7280] shadow-sm">
                  {monthDemands.length} Demandas
                </span>
              </div>
              <div className="space-y-2">
                {monthDemands.slice(0, 4).map(demand => (
                  <div 
                    key={demand.id} 
                    onClick={() => setSelectedDemand(demand)}
                    className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#E5E7EB] text-[10px] hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className={cn(
                      "w-1 h-1 rounded-full group-hover:scale-125 transition-transform",
                      demand.priority === DemandPriority.CRITICA ? "bg-red-500" :
                      demand.priority === DemandPriority.ALTA ? "bg-orange-500" :
                      "bg-blue-500"
                    )} />
                    <span className="font-bold truncate flex-1">{demand.title}</span>
                    <span className="text-[#9CA3AF] shrink-0">{format(demand.date, 'dd/MM')}</span>
                  </div>
                ))}
                {monthDemands.length > 4 && (
                  <p className="text-[9px] text-[#9CA3AF] text-center font-bold">+{monthDemands.length - 4} outras</p>
                )}
                {monthDemands.length === 0 && (
                  <p className="text-[10px] text-[#9CA3AF] text-center py-4">Sem atividades</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const lastDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#141414]">Agenda Operacional</h2>
          <p className="text-[#6B7280]">Inspeções, visitas e cronogramas de manutenção.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-[#E5E7EB] shadow-sm">
          {[
            { id: 'day', label: 'Dia' },
            { id: 'month', label: 'Mês' },
            { id: 'quarter', label: 'Trim' },
            { id: 'semester', label: 'Sem' },
            { id: 'year', label: 'Ano' }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setViewMode(view.id as ViewMode)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                viewMode === view.id ? "bg-[#141414] text-white" : "text-[#6B7280] hover:bg-gray-50"
              )}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm min-h-[600px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-[#141414] capitalize">
                {getViewTitle()}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrev}
                className="p-2 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 text-[#6B7280] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                Hoje
              </button>
              <button 
                onClick={handleNext}
                className="p-2 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 text-[#6B7280] transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + currentDate.getTime()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderViewContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-[#141414] p-6 rounded-3xl text-white shadow-xl">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" />
              Próximas 24h
            </h3>
            <div className="space-y-4">
              {filteredDemands
                .filter(d => {
                  const now = new Date();
                  const tomorrow = new Date(now.getTime() + 86400000);
                  return isWithinInterval(d.date, { start: now, end: tomorrow });
                })
                .map(demand => (
                <div key={demand.id} className="p-3 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                  <span className="text-[9px] font-bold uppercase text-white/50">{demand.sector}</span>
                  <h4 className="text-xs font-bold mt-1 line-clamp-1">{demand.title}</h4>
                  <div className="flex items-center justify-between mt-3 text-[10px] text-white/70">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(demand.date, 'HH:mm')}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {demand.protocol}
                    </div>
                  </div>
                </div>
              ))}
              {filteredDemands.filter(d => {
                  const now = new Date();
                  const tomorrow = new Date(now.getTime() + 86400000);
                  return isWithinInterval(d.date, { start: now, end: tomorrow });
                }).length === 0 && (
                <p className="text-xs text-white/40 text-center py-4">Nenhuma atividade próxima.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
            <h3 className="font-bold text-[#141414] mb-4">Urgências</h3>
            <div className="space-y-4">
              {demands.filter(d => d.priority === DemandPriority.CRITICA).slice(0, 3).map(demand => (
                <div key={demand.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-2xl border border-red-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#141414] truncate">{demand.title}</p>
                    <p className="text-[10px] text-red-600 mt-0.5">SLA crítico em {format(new Date(demand.deadline || demand.createdAt), 'dd/MM')}</p>
                  </div>
                </div>
              ))}
              {demands.filter(d => d.priority === DemandPriority.CRITICA).length === 0 && (
                <p className="text-xs text-[#9CA3AF] text-center py-4">Tudo sob controle.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedDemand && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end p-4">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-lg bg-white h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-[#F3F4F6] flex items-center justify-between bg-[#F9FAFB]">
                <div>
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em] mb-1 block">Detalhes da Demanda</span>
                  <h3 className="text-xl font-bold text-[#141414]">{selectedDemand.protocol}</h3>
                </div>
                <button 
                  onClick={() => setSelectedDemand(null)}
                  className="p-2 hover:bg-[#F3F4F6] rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-[#6B7280]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <h4 className="text-2xl font-bold text-[#141414] mb-2">{selectedDemand.title}</h4>
                  <p className="text-[#6B7280] leading-relaxed">{selectedDemand.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h5 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4">Setor Responsável</h5>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 font-bold text-sm">
                          {selectedDemand.sector.charAt(0)}
                        </div>
                        <p className="text-sm font-bold text-[#141414]">{selectedDemand.sector}</p>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4">Prioridade</h5>
                      <span className={cn(
                        "text-sm font-bold px-3 py-1.5 rounded-xl",
                        selectedDemand.priority === DemandPriority.CRITICA ? "bg-red-50 text-red-600" :
                        selectedDemand.priority === DemandPriority.ALTA ? "bg-orange-50 text-orange-600" :
                        "bg-blue-50 text-blue-600"
                      )}>
                        {selectedDemand.priority}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h5 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4">Prazo de Execução</h5>
                      <div className="flex items-center gap-3 text-[#141414]">
                        <Clock className="w-5 h-5 text-[#3B82F6]" />
                        <p className="text-sm font-bold">
                          {selectedDemand.deadline ? format(new Date(selectedDemand.deadline), "dd/MM/yyyy", { locale: ptBR }) : 'Não definido'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4">Status</h5>
                      <span className={cn(
                        "text-sm font-bold px-3 py-1.5 rounded-xl",
                        selectedDemand.status === 'FINALIZADO' ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                      )}>
                        {selectedDemand.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-[#F3F4F6]">
                  <h5 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4">Responsável Atribuído</h5>
                  <div className="flex items-center gap-4 bg-[#F9FAFB] p-4 rounded-2xl">
                    <div className="w-12 h-12 bg-[#141414] rounded-xl flex items-center justify-center text-white font-bold">
                      {selectedDemand.assignedTo?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#141414]">{selectedDemand.assignedTo || 'Não atribuído'}</p>
                      <p className="text-xs text-[#6B7280]">Técnico Responsável</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

