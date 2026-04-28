/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ClipboardList, 
  Users, 
  Calendar, 
  FileText, 
  LayoutDashboard, 
  Settings, 
  TrendingUp, 
  Plus, 
  Search, 
  Bell, 
  FilePlus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  Upload,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import DemandList from './components/DemandList';
import TeamManager from './components/TeamManager';
import Agenda from './components/Agenda';
import DataImport from './components/DataImport';
import Reports from './components/Reports';
import { Demand, DemandPriority, DemandStatus } from './types';
import { supabase } from './lib/supabase';

type View = 'dashboard' | 'demands' | 'team' | 'agenda' | 'import' | 'reports' | 'notifications';

const INITIAL_DEMANDS: Demand[] = [
  {
    id: '1',
    protocol: 'OPS-2024-001',
    title: 'Manutenção Preventiva AHU-01',
    description: 'Manutenção preventiva periódica da unidade de tratamento de ar AHU-01.',
    sector: 'Manutenção',
    status: DemandStatus.EM_ANDAMENTO,
    priority: DemandPriority.ALTA,
    assignedTo: 'Carlos Silva',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    deadline: Date.now() + 86400000
  },
  {
    id: '2',
    protocol: 'TI-2024-042',
    description: 'Atualização crítica de segurança para o switch principal do core da rede.',
    title: 'Atualização de Firmware Switch Core',
    sector: 'TI',
    status: DemandStatus.PENDENTE,
    priority: DemandPriority.CRITICA,
    assignedTo: 'Ana Souza',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 7200000,
    deadline: Date.now() + 28800000
  },
  {
    id: '3',
    protocol: 'SEC-2024-015',
    description: 'Revisão dos logs de acesso físico de todas as entradas da torre A.',
    title: 'Auditoria de Acessos Físicos',
    sector: 'Segurança',
    status: DemandStatus.FINALIZADO,
    priority: DemandPriority.MEDIA,
    assignedTo: 'Roberto Lima',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    deadline: Date.now() - 3600000
  }
];

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'SLA Crítico', message: 'Demanda #ELE-2024-001 ultrapassou o tempo estimado.', time: '5 min atrás', type: 'error' },
    { id: 2, title: 'Nova Demanda', message: 'Ana Souza iniciou um novo chamado em TI.', time: '12 min atrás', type: 'info' },
    { id: 3, title: 'Performance', message: 'Sua equipe atingiu a meta de produtividade diária.', time: '1h atrás', type: 'success' },
  ]);

  useEffect(() => {
    fetchDemands();
  }, []);

  const fetchDemands = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      if (data) {
        setDemands(data.map(d => ({
          ...d,
          createdAt: new Date(d.created_at).getTime(),
          updatedAt: new Date(d.created_at).getTime(),
          deadline: d.date ? new Date(d.date).getTime() : Date.now() + 86400000,
          protocol: d.id.slice(0, 8).toUpperCase()
        })));
      }
    } catch (err) {
      console.error('Error fetching demands:', err);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'demands' as View, label: 'Demandas', icon: ClipboardList },
    { id: 'import' as View, label: 'Importar Dados', icon: Upload },
    { id: 'agenda' as View, label: 'Agenda Operacional', icon: Calendar },
    { id: 'team' as View, label: 'Equipe', icon: Users },
    { id: 'reports' as View, label: 'Relatórios', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#F0F1F3] text-[#1A1A1A] font-sans flex">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-[#0D0D0D] text-white flex flex-col h-screen sticky top-0 z-50 overflow-hidden border-r border-white/5"
      >
        <div className="p-8 flex items-center justify-between">
          {isSidebarOpen ? (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold tracking-[0.2em] text-white flex items-center gap-3 uppercase"
            >
              <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#0D0D0D]" />
              </div>
              OpIntel
            </motion.h1>
          ) : (
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mx-auto">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden",
                activeView === item.id 
                  ? "bg-white text-[#0D0D0D] font-bold" 
                  : "text-white/40 hover:text-white"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0 transition-transform group-active:scale-95", activeView === item.id ? "text-[#0D0D0D]" : "text-white/30 group-hover:text-white")} />
              {isSidebarOpen && (
                <span className="text-[11px] uppercase tracking-widest truncate">{item.label}</span>
              )}
              {!isSidebarOpen && activeView === item.id && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4 mx-auto" />}
            {isSidebarOpen && <span className="text-[10px] uppercase font-bold tracking-widest">Fechar</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB] flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-[#9CA3AF]">
            <span className="text-[#141414]">Operação</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#141414]">{activeView}</span>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="PROCURAR..." 
                className="pl-12 pr-6 py-2.5 bg-[#F3F4F6] border-none rounded-sm text-[11px] font-mono tracking-wider focus:ring-1 focus:ring-[#141414] transition-all w-72 uppercase"
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={cn(
                  "relative p-2 rounded-full transition-colors",
                  isNotificationsOpen ? "bg-[#141414] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]"
                )}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-0" 
                      onClick={() => setIsNotificationsOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-[#F3F4F6] flex items-center justify-between">
                        <h4 className="font-bold text-sm text-[#141414]">Notificações</h4>
                        <button 
                          onClick={() => setNotifications([])}
                          className="text-[10px] font-bold text-[#6B7280] hover:text-[#141414] uppercase tracking-wider"
                        >
                          Limpar tudo
                        </button>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div key={n.id} className="p-4 hover:bg-[#F9FAFB] transition-colors border-b border-[#F3F4F6] last:border-0 group cursor-pointer">
                              <div className="flex gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                  n.type === 'error' ? "bg-red-500" : n.type === 'success' ? "bg-green-500" : "bg-blue-500"
                                )} />
                                <div>
                                  <p className="text-xs font-bold text-[#141414] mb-0.5">{n.title}</p>
                                  <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">{n.message}</p>
                                  <p className="text-[9px] text-[#9CA3AF] mt-2 font-medium">{n.time}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="w-8 h-8 text-[#E5E7EB] mx-auto mb-2" />
                            <p className="text-xs text-[#9CA3AF] font-medium">Nenhuma notificação por enquanto.</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-[#F9FAFB] text-center">
                        <button 
                          onClick={() => {
                            setActiveView('notifications');
                            setIsNotificationsOpen(false);
                          }}
                          className="text-[10px] font-bold text-[#141414] hover:underline uppercase tracking-widest"
                        >
                          Ver todo o histórico
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-[1px] bg-[#E5E7EB]" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[#141414]">Analista Júnior</p>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">Operações</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#141414] to-[#4B5563]" />
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 border-4 border-[#141414] border-t-white rounded-full"
                />
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#141414]">Sincronizando Sistema</p>
              </div>
            ) : (
              <motion.div
                key={activeView}
                initial={{ opacity: 0, scale: 0.99, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.01, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                className="max-w-[1400px] mx-auto w-full"
              >
                {activeView === 'dashboard' && (
                  <Dashboard 
                    demands={demands} 
                    setDemands={setDemands} 
                    onViewChange={(view: any) => setActiveView(view)} 
                  />
                )}
                {activeView === 'demands' && <DemandList demands={demands} setDemands={setDemands} />}
                {activeView === 'team' && <TeamManager />}
                {activeView === 'agenda' && <Agenda demands={demands} />}
                {activeView === 'import' && <DataImport demands={demands} setDemands={setDemands} onImportComplete={fetchDemands} />}
                {activeView === 'reports' && <Reports />}
                {activeView === 'notifications' && (
                  <div className="space-y-12">
                    <div className="space-y-4">
                      <h2 className="text-4xl font-extrabold tracking-tighter text-[#0D0D0D]">LOG DE STATUS</h2>
                      <div className="h-1 w-20 bg-[#141414]" />
                    </div>
                    <div className="bg-white rounded-sm border border-[#E5E7EB] overflow-hidden">
                      <div className="p-8 border-b border-[#F3F4F6] bg-[#FAFAFA]">
                        <p className="text-[11px] font-mono tracking-widest text-[#6B7280] uppercase">MÉTRICAS DE NOTIFICAÇÃO DO NÚCLEO</p>
                      </div>
                      <div className="divide-y divide-[#F3F4F6]">
                        {notifications.map((n) => (
                          <div key={n.id} className="p-8 hover:bg-[#F9FAFB] transition-all flex items-start gap-6 group cursor-crosshair">
                            <div className={cn(
                              "w-12 h-12 rounded-sm flex items-center justify-center shrink-0 border border-black/5 transition-transform group-hover:scale-110",
                              n.type === 'error' ? "bg-red-50" : n.type === 'success' ? "bg-green-50" : "bg-blue-50"
                            )}>
                              <Bell className={cn(
                                "w-5 h-5",
                                n.type === 'error' ? "text-red-500" : n.type === 'success' ? "text-green-500" : "text-blue-500"
                              )} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-[#141414] tracking-tight text-lg">{n.title}</h4>
                                <span className="text-[10px] font-mono text-[#9CA3AF] uppercase bg-[#F3F4F6] px-2 py-1">{n.time}</span>
                              </div>
                              <p className="text-sm text-[#6B7280] leading-relaxed max-w-2xl">{n.message}</p>
                            </div>
                          </div>
                        ))}
                        {notifications.length === 0 && (
                          <div className="p-20 text-center">
                            <Bell className="w-16 h-16 text-[#E5E7EB] mx-auto mb-6 opacity-20" />
                            <p className="text-[11px] uppercase tracking-widest text-[#9CA3AF] font-bold">LOGS LIMPOS</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
