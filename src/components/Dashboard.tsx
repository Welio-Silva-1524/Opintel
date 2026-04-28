import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Clock, CheckCircle2, AlertCircle, TrendingUp, ClipboardList, Plus, X, Edit2, Save, ArrowUpRight, Zap, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Demand, DemandStatus, DemandPriority } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  demands: Demand[];
  setDemands: React.Dispatch<React.SetStateAction<Demand[]>>;
  onViewChange: (view: any) => void;
}

const PERIOD_DATA: Record<string, any[]> = {
// ... existing period data ...
  '7d': [
    { name: 'Seg', demandas: 40, tempo: 2.4, produtividade: 85 },
    { name: 'Ter', demandas: 30, tempo: 1.8, produtividade: 90 },
    { name: 'Qua', demandas: 20, tempo: 2.2, produtividade: 75 },
    { name: 'Qui', demandas: 27, tempo: 1.5, produtividade: 95 },
    { name: 'Sex', demandas: 18, tempo: 1.9, produtividade: 88 },
    { name: 'Sáb', demandas: 23, tempo: 2.1, produtividade: 82 },
    { name: 'Dom', demandas: 34, tempo: 2.5, produtividade: 80 },
  ],
  '30d': [
    { name: 'S1', demandas: 120, produtividade: 82 },
    { name: 'S2', demandas: 145, produtividade: 88 },
    { name: 'S3', demandas: 110, produtividade: 85 },
    { name: 'S4', demandas: 160, produtividade: 92 },
  ],
  'tri': [
    { name: 'Jan', demandas: 450, produtividade: 80 },
    { name: 'Fev', demandas: 520, produtividade: 84 },
    { name: 'Mar', demandas: 480, produtividade: 88 },
  ],
  'sem': [
    { name: 'Q1', demandas: 1200, produtividade: 85 },
    { name: 'Q2', demandas: 1500, produtividade: 89 },
  ],
  'ano': [
    { name: '2021', demandas: 4200, produtividade: 75 },
    { name: '2022', demandas: 4800, produtividade: 82 },
    { name: '2023', demandas: 5500, produtividade: 88 },
    { name: '2024', demandas: 2100, produtividade: 92 },
  ]
};

const StatCard = ({ title, value, icon: Icon, trend, color, subtitle }: any) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="bg-white p-8 rounded-sm border border-[#E5E7EB] flex flex-col justify-between group h-full relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon className="w-16 h-16" />
    </div>
    
    <div className="space-y-4 relative z-10">
      <div className="flex items-center gap-2">
        <div className={cn("w-1 h-3 rounded-full", color)} />
        <span className="text-[10px] font-bold tracking-[0.2em] text-[#9CA3AF] uppercase">{title}</span>
      </div>
      
      <div>
        <div className="flex items-baseline gap-3">
          <h3 className="text-4xl font-black text-[#0D0D0D] font-mono tracking-tighter">{value}</h3>
          {trend && (
            <div className={cn(
              "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5",
              trend > 0 ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"
            )}>
              {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-[10px] text-[#6B7280] font-medium tracking-tight mt-1">{subtitle}</p>
      </div>
    </div>
  </motion.div>
);

export default function Dashboard({ demands, setDemands, onViewChange }: DashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const stats = useMemo(() => {
    const active = demands.filter(d => d.status !== DemandStatus.FINALIZADO).length;
    const concluded = demands.filter(d => d.status === DemandStatus.FINALIZADO).length;
    const urgent = demands.filter(d => d.status === DemandStatus.URGENTE || d.priority === DemandPriority.CRITICA).length;
    return { active, total: demands.length, concluded, urgent };
  }, [demands]);

  const displayedDemands = useMemo(() => {
    return showAllHistory ? demands : demands.slice(0, 6);
  }, [demands, showAllHistory]);

  const chartData = PERIOD_DATA[selectedPeriod] || PERIOD_DATA['7d'];

  const handleSave = async () => {
    if (!selectedDemand) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('demands')
        .update({
          title: selectedDemand.title,
          description: selectedDemand.description,
          sector: selectedDemand.sector,
          status: selectedDemand.status,
          priority: selectedDemand.priority,
          date: selectedDemand.deadline ? new Date(selectedDemand.deadline).toISOString().split('T')[0] : null
        })
        .eq('id', selectedDemand.id);

      if (error) throw error;
      
      setDemands(prev => prev.map(d => d.id === selectedDemand.id ? selectedDemand : d));
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating:', err);
      alert('Erro ao sincronizar com servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FINALIZADO': return 'bg-green-50 text-green-700 border-green-100';
      case 'PENDENTE': return 'bg-slate-50 text-slate-600 border-slate-100';
      case 'Aguardando': return 'bg-slate-50 text-slate-600 border-slate-100';
      case 'EM_ANDAMENTO': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'URGENTE': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Hero / Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-[#141414] text-white text-[10px] font-bold tracking-[0.2em] rounded-sm uppercase">NÚCLEO ATIVO</div>
            <span className="text-[10px] font-bold text-[#9CA3AF] tracking-widest uppercase">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-[#0D0D0D] uppercase leading-none">Visão Geral</h2>
          <p className="text-[#6B7280] text-sm max-w-lg leading-relaxed">
            Agregação de telemetria operacional em tempo real. Monitore o fluxo de demandas sincronizadas por IA.
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => onViewChange('import')}
            className="px-6 py-3 bg-[#0D0D0D] text-white text-[11px] font-bold tracking-widest uppercase hover:bg-black transition-all flex items-center gap-3 rounded-sm group overflow-hidden relative shadow-lg"
          >
            <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="relative z-10">Ingestão Rápida</span>
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Ativas" 
          value={stats.active.toString()} 
          icon={ClipboardList} 
          trend={12} 
          color="bg-[#141414]" 
          subtitle="Capacidade operacional total"
        />
        <StatCard 
          title="Sincronizadas" 
          value={stats.total.toString()} 
          icon={TrendingUp} 
          trend={5}
          color="bg-blue-500" 
          subtitle="Volume global processado"
        />
        <StatCard 
          title="Concluídas" 
          value={stats.concluded.toString()} 
          icon={CheckCircle2} 
          color="bg-green-500" 
          subtitle="Taxa de resolução de 78%"
        />
        <StatCard 
          title="Pico Crítico" 
          value={stats.urgent.toString()} 
          icon={AlertCircle} 
          color="bg-red-500" 
          subtitle="Requer atenção imediata"
        />
      </section>

      {/* Charts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-sm border border-[#E5E7EB] relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#141414]" />
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-[12px] font-black tracking-widest text-[#0D0D0D] uppercase">Volume de Operação</h3>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Histórico de cargas operacionais</p>
            </div>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-[10px] font-bold tracking-widest uppercase bg-[#F3F4F6] border-none rounded-sm px-4 py-2 outline-none cursor-pointer hover:bg-[#E5E7EB] transition-colors appearance-none"
            >
              <option value="7d">07 Dias</option>
              <option value="30d">30 Dias</option>
              <option value="tri">Trimestre</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDemands" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#141414" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} 
                />
                <Tooltip 
                  cursor={{ stroke: '#0D0D0D', strokeWidth: 1 }}
                  contentStyle={{ 
                    backgroundColor: '#0D0D0D', 
                    border: 'none', 
                    borderRadius: '2px', 
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '12px'
                  }}
                  itemStyle={{ color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="demandas" 
                  stroke="#141414" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorDemands)" 
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-sm border border-[#E5E7EB] relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-[12px] font-black tracking-widest text-[#0D0D0D] uppercase">Rendimento do Núcleo</h3>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Métricas de eficiência sistêmica</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-green-100">
              <Zap className="w-3 h-3" />
              SLA +8%
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} />
                <Tooltip 
                  cursor={{ fill: '#F9FAFB' }}
                  contentStyle={{ backgroundColor: '#0D0D0D', border: 'none', borderRadius: '2px', fontSize: '10px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff', textTransform: 'uppercase' }}
                />
                <Bar 
                  dataKey="produtividade" 
                  fill="#141414" 
                  radius={[1, 1, 0, 0]} 
                  barSize={12} 
                  animationDuration={1200}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Main Grid: List + Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Recent Demands Table-like List */}
        <div className="lg:col-span-8 bg-white rounded-sm border border-[#E5E7EB] overflow-hidden">
          <div className="p-8 border-b border-[#F3F4F6] flex items-center justify-between bg-[#FAFAFA]">
            <h3 className="text-[12px] font-black tracking-widest text-[#0D0D0D] uppercase">Fila de Prioridade</h3>
            <button 
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="text-[10px] font-bold text-[#141414] tracking-widest uppercase hover:underline"
            >
              {showAllHistory ? 'Recolher' : 'Ver Todo o Histórico'}
            </button>
          </div>
          <div className="divide-y divide-[#F3F4F6]">
            {displayedDemands.map((demand) => (
              <button 
                key={demand.id} 
                onClick={() => { setSelectedDemand(demand); setIsEditing(false); }}
                className="w-full flex items-center p-8 hover:bg-[#F9FAFB] transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-[#141414] scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 items-center gap-6">
                  <div className="md:col-span-2 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">{demand.sector}</span>
                      <span className="text-[9px] font-mono text-[#9CA3AF] tracking-widest">#{demand.protocol}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#141414] group-hover:translate-x-1 transition-transform truncate">{demand.title}</h4>
                  </div>
                  
                  <div className="flex flex-col items-start gap-1">
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border",
                      getStatusColor(demand.status)
                    )}>
                      {demand.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-mono text-[#9CA3AF] tracking-wider uppercase">Sincronizado</span>
                    <span className="text-[10px] font-bold text-[#141414] uppercase">{demand.createdAt ? getTimeAgo(demand.createdAt) : 'Recente'}</span>
                  </div>
                </div>
              </button>
            ))}
            {demands.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <Database className="w-12 h-12 text-[#E5E7EB] opacity-50" />
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#9CA3AF]">Sem registros sincronizados</p>
                <button 
                  onClick={() => onViewChange('import')}
                  className="text-[10px] font-bold text-[#141414] underline underline-offset-4 uppercase tracking-widest"
                >
                  Iniciar Importação
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Insights Section */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#0D0D0D] p-10 rounded-sm text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-12 h-12" />
            </div>
            <h3 className="text-[12px] font-bold tracking-widest uppercase mb-8 border-b border-white/10 pb-4">Análise Preditiva</h3>
            <div className="space-y-6">
              <div className="space-y-2 group cursor-help">
                <div className="flex items-center gap-2 text-blue-400">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Alerta de Recorrência</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed font-medium group-hover:text-white transition-colors uppercase tracking-tight">
                  "Picos cíclicos detectados em <span className="text-white underline">Infraestrutura</span> às quartas. Recomenda-se alocação antecipada."
                </p>
              </div>
              
              <div className="space-y-2 group cursor-help">
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Eficiência Global</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed font-medium group-hover:text-white transition-colors uppercase tracking-tight">
                  "Tempo de resposta reduziu <span className="text-white underline">24%</span> após integração do motor Gemini 1.5 Pro."
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5">
                <p className="text-[9px] text-white/30 uppercase tracking-[0.2em]">Última atualização: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-10 rounded-sm border border-[#E5E7EB] relative overflow-hidden">
             <h3 className="text-[10px] font-bold tracking-widest text-[#9CA3AF] uppercase mb-6">Status da Conexão</h3>
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-green-50 rounded-sm flex items-center justify-center border border-green-100">
                 <Database className="w-5 h-5 text-green-500" />
               </div>
               <div>
                 <p className="text-[11px] font-black uppercase text-[#141414]">Supabase Realtime</p>
                 <p className="text-[9px] uppercase tracking-widest text-[#9CA3AF] mt-0.5">Sincronizado via WebSocket</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Modal is kept with same logic but updated styling */}
      <AnimatePresence>
        {selectedDemand && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setSelectedDemand(null)}
              className="absolute inset-0 bg-[#0D0D0D]/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-white w-full max-w-2xl rounded-sm shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-white/10"
            >
              <div className="p-10 border-b border-[#F3F4F6] flex items-center justify-between bg-[#FAFAFA]">
                <div className="flex-1 space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#9CA3AF]">Protocolo #{selectedDemand.protocol}</p>
                  {isEditing ? (
                    <input 
                      className="bg-white border border-[#E5E7EB] text-[#141414] rounded-sm px-4 py-2 text-2xl font-black uppercase tracking-tighter w-full focus:ring-1 focus:ring-[#141414] outline-none"
                      value={selectedDemand.title}
                      onChange={e => setSelectedDemand({...selectedDemand, title: e.target.value})}
                      disabled={isSaving}
                    />
                  ) : (
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-[#0D0D0D]">{selectedDemand.title}</h3>
                  )}
                </div>
                <div className="flex items-center gap-4 ml-6">
                   <button 
                    onClick={() => {
                        if (isEditing) handleSave();
                        else setIsEditing(true);
                    }}
                    disabled={isSaving}
                    className={cn(
                      "p-3 rounded-full transition-all border",
                      isEditing ? "bg-[#141414] text-white border-black" : "bg-white text-[#141414] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                    )}
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />)}
                  </button>
                  <button 
                    onClick={() => { setSelectedDemand(null); setIsEditing(false); }}
                    disabled={isSaving}
                    className="p-3 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#141414] rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto p-12 custom-scrollbar space-y-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">Contexto Setorial</p>
                    {isEditing ? (
                      <input 
                        className="text-[11px] font-bold uppercase tracking-widest text-[#141414] bg-white border border-[#E5E7EB] rounded-sm p-2 w-full outline-none"
                        value={selectedDemand.sector}
                        onChange={e => setSelectedDemand({...selectedDemand, sector: e.target.value})}
                      />
                    ) : (
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#141414] px-3 py-1 bg-[#F3F4F6] border border-[#E5E7EB] inline-block">{selectedDemand.sector}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">Nível de Prioridade</p>
                    {isEditing ? (
                      <select 
                        className="text-[11px] font-bold uppercase tracking-widest bg-white border border-[#E5E7EB] rounded-sm p-2 w-full outline-none"
                        value={selectedDemand.priority}
                        onChange={e => setSelectedDemand({...selectedDemand, priority: e.target.value as any})}
                      >
                        <option value="BAIXA">BAIXA</option>
                        <option value="MEDIA">MEDIA</option>
                        <option value="ALTA">ALTA</option>
                        <option value="CRITICA">CRÍTICA</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                         <div className={cn("w-2 h-2 rounded-full", (selectedDemand.priority === 'ALTA' || selectedDemand.priority === 'CRITICA') ? "bg-red-500" : "bg-yellow-500")} />
                         <span className={cn(
                            "text-[11px] font-bold uppercase tracking-widest",
                            (selectedDemand.priority === 'ALTA' || selectedDemand.priority === 'CRITICA') ? "text-red-500" : "text-yellow-600"
                          )}>{selectedDemand.priority}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em]">Memória Descritiva</h5>
                  {isEditing ? (
                    <textarea 
                      className="w-full text-xs font-mono text-[#141414] leading-relaxed bg-white p-6 rounded-sm border border-[#E5E7EB] focus:ring-1 focus:ring-[#141414] outline-none min-h-[150px] uppercase placeholder:text-[#9CA3AF]"
                      value={selectedDemand.description}
                      onChange={e => setSelectedDemand({...selectedDemand, description: e.target.value})}
                    />
                  ) : (
                    <p className="text-xs font-mono text-[#6B7280] leading-loose bg-[#FAFAFA] p-6 border border-[#F3F4F6] uppercase">
                      {selectedDemand.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-10 border-t border-[#F3F4F6] flex gap-4">
                  <button 
                    onClick={() => { setSelectedDemand(null); setIsEditing(false); }}
                    className="flex-1 py-4 border border-[#E5E7EB] rounded-sm text-[11px] font-bold uppercase tracking-widest text-[#6B7280] hover:bg-gray-50 transition-all"
                  >
                    Fechar Visualização
                  </button>
                  <button 
                  onClick={async () => {
                    const { error } = await supabase
                        .from('demands')
                        .update({ status: DemandStatus.FINALIZADO })
                        .eq('id', selectedDemand.id);
                    if (!error) {
                        setDemands(prev => prev.map(d => d.id === selectedDemand.id ? {...d, status: DemandStatus.FINALIZADO} : d));
                        setSelectedDemand(null);
                    }
                  }}
                  className="flex-1 py-4 bg-[#0D0D0D] text-white rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-black shadow-lg transition-all"
                >
                  Finalizar Ciclo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
    <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={cn("w-4 h-4 border-2 border-white/20 border-t-white rounded-full", className)}
    />
);
