import { useState, FormEvent, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Users,
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  Flag,
  FileText,
  X,
  Eye,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Demand, DemandStatus, DemandPriority } from '../types';

interface DemandListProps {
  demands: Demand[];
  setDemands: React.Dispatch<React.SetStateAction<Demand[]>>;
}

export default function DemandList({ demands, setDemands }: DemandListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [formData, setFormData] = useState({
    title: '',
    sector: '',
    priority: DemandPriority.MEDIA,
    description: '',
    assignedTo: '',
    deadline: format(new Date(), 'yyyy-MM-dd')
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = (demand: any) => {
    setEditingId(demand.id);
    setFormData({
      title: demand.title,
      sector: demand.sector,
      priority: demand.priority,
      description: demand.description || '',
      assignedTo: demand.assignedTo === 'Não atribuído' ? '' : demand.assignedTo,
      deadline: format(new Date(demand.deadline || Date.now()), 'yyyy-MM-dd')
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = (id: string) => {
    setDemands(demands.filter(d => d.id !== id));
    setActiveMenuId(null);
  };

  const getStatusStyle = (status: DemandStatus) => {
    switch (status) {
      case DemandStatus.PENDENTE: return 'bg-gray-100 text-gray-700';
      case DemandStatus.EM_ANDAMENTO: return 'bg-blue-100 text-blue-700';
      case DemandStatus.FINALIZADO: return 'bg-green-100 text-green-700';
      case DemandStatus.URGENTE: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityStyle = (priority: DemandPriority) => {
    switch (priority) {
      case DemandPriority.CRITICA: return 'text-red-600';
      case DemandPriority.ALTA: return 'text-orange-500';
      case DemandPriority.MEDIA: return 'text-yellow-600';
      case DemandPriority.BAIXA: return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const deadlineTimestamp = new Date(formData.deadline).getTime();

    if (editingId) {
      setDemands(demands.map(d => 
        d.id === editingId 
          ? { ...d, ...formData, deadline: deadlineTimestamp, assignedTo: formData.assignedTo || 'Não atribuído' } 
          : d
      ));
    } else {
      const newDemand: Demand = {
        id: Math.random().toString(36).substr(2, 9),
        protocol: `OPS-2024-${String(demands.length + 1).padStart(3, '0')}`,
        title: formData.title,
        description: formData.description,
        sector: formData.sector,
        status: DemandStatus.PENDENTE,
        priority: formData.priority,
        assignedTo: formData.assignedTo || 'Não atribuído',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deadline: deadlineTimestamp
      };
      setDemands([newDemand, ...demands]);
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: '', sector: '', priority: DemandPriority.MEDIA, description: '', assignedTo: '', deadline: format(new Date(), 'yyyy-MM-dd') });
  };

  const filteredDemands = demands.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDemands.length / itemsPerPage);
  const paginatedDemands = filteredDemands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#141414]">Gestão de Demandas</h2>
          <p className="text-[#6B7280]">Visualize e acompanhe o status de todas as demandas operacionais.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#141414] text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-black/10 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nova Demanda
        </button>
      </div>

      {/* Modal / Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="p-6 border-b border-[#F3F4F6] flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#141414]">
                {editingId ? 'Editar Demanda' : 'Abrir Nova Demanda'}
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setFormData({ title: '', sector: '', priority: DemandPriority.MEDIA, description: '', assignedTo: '', deadline: format(new Date(), 'yyyy-MM-dd') });
                }}
                className="p-2 hover:bg-[#F3F4F6] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Título da Demanda</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Vazamento no Setor B" 
                  className="w-full px-4 py-3 bg-[#F3F4F6] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#141414] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Setor</label>
                  <input 
                    required
                    type="text" 
                    value={formData.sector}
                    onChange={e => setFormData({...formData, sector: e.target.value})}
                    placeholder="Ex: Manutenção" 
                    className="w-full px-4 py-3 bg-[#F3F4F6] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#141414] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Prioridade</label>
                  <select 
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value as DemandPriority})}
                    className="w-full px-4 py-3 bg-[#F3F4F6] border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#141414] outline-none"
                  >
                    {Object.values(DemandPriority).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Prazo de Execução</label>
                <input 
                  required
                  type="date" 
                  value={formData.deadline}
                  onChange={e => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F3F4F6] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#141414] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Atribuir Para (Opcional)</label>
                <select 
                  value={formData.assignedTo}
                  onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F3F4F6] border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#141414] outline-none"
                >
                  <option value="">Selecione um colaborador</option>
                  <option value="Carlos Silva">Carlos Silva</option>
                  <option value="Ana Souza">Ana Souza</option>
                  <option value="Roberto Lima">Roberto Lima</option>
                  <option value="Juliana Castro">Juliana Castro</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Descrição Detalhada</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o problema ou solicitação..." 
                  rows={3}
                  className="w-full px-4 py-3 bg-[#F3F4F6] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#141414] transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({ title: '', sector: '', priority: DemandPriority.MEDIA, description: '', assignedTo: '', deadline: format(new Date(), 'yyyy-MM-dd') });
                  }}
                  className="flex-1 px-4 py-3 border border-[#E5E7EB] rounded-xl font-bold text-sm text-[#6B7280] hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#141414] text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-black/10"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Demanda'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Filters & Tools */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input 
            type="text" 
            placeholder="Buscar por protocolo, título ou setor..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F3F4F6] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#141414] transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] transition-colors">
            <Filter className="w-4 h-4 text-[#6B7280]" />
          </button>
          <div className="h-6 w-[1px] bg-[#E5E7EB] mx-1" />
          <div className="flex bg-[#F3F4F6] p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === 'list' ? "bg-white shadow-sm text-[#141414]" : "text-[#9CA3AF]")}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-[#141414]" : "text-[#9CA3AF]")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table/List */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">
        {viewMode === 'list' ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Protocolo</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Demanda</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Prioridade</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Atribuído</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {paginatedDemands.map((demand) => (
                <tr 
                  key={demand.id} 
                  onClick={() => setSelectedDemand(demand)}
                  className="hover:bg-[#F9FAFB] transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-[#141414]">{demand.protocol}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#141414]">{demand.title}</span>
                      <span className="text-[10px] text-[#6B7280] font-medium uppercase">{demand.sector}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full uppercase", getStatusStyle(demand.status))}>
                      {demand.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Flag className={cn("w-3 h-3", getPriorityStyle(demand.priority))} />
                      <span className={cn("text-xs font-bold capitalize", getPriorityStyle(demand.priority))}>
                        {demand.priority.toLowerCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center">
                        <Users className="w-3 h-3 text-[#6B7280]" />
                      </div>
                      <span className="text-xs font-medium text-[#141414]">{demand.assignedTo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === demand.id ? null : demand.id);
                      }}
                      className="p-1.5 hover:bg-[#E5E7EB] rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-[#6B7280]" />
                    </button>
                    
                    <AnimatePresence>
                      {activeMenuId === demand.id && (
                        <motion.div 
                          ref={menuRef}
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-6 top-12 w-48 bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden"
                        >
                          <div className="py-1">
                            <button 
                              onClick={() => {
                                setSelectedDemand(demand);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-bold text-[#141414] hover:bg-[#F3F4F6] flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Visualizar Detalhes
                            </button>
                            <button 
                              onClick={() => handleEdit(demand)}
                              className="w-full px-4 py-2 text-left text-xs font-bold text-[#141414] hover:bg-[#F3F4F6] flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Editar Demanda
                            </button>
                            <div className="h-[1px] bg-[#F3F4F6] my-1" />
                            <button 
                              onClick={() => handleDelete(demand.id)}
                              className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir Registro
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-[#F8F9FA]">
            {paginatedDemands.length > 0 && paginatedDemands.map((demand) => (
              <motion.div 
                key={demand.id}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedDemand(demand)}
                className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col gap-4 relative cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#9CA3AF]">{demand.protocol}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase", getStatusStyle(demand.status))}>
                      {demand.status.replace('_', ' ')}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === demand.id ? null : demand.id);
                      }}
                      className="p-1 hover:bg-[#F3F4F6] rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                    
                    <AnimatePresence>
                      {activeMenuId === demand.id && (
                        <motion.div 
                          ref={menuRef}
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-4 top-10 w-44 bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden"
                        >
                          <div className="py-1">
                            <button 
                              onClick={() => {
                                setSelectedDemand(demand);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-[10px] font-bold text-[#141414] hover:bg-[#F3F4F6] flex items-center gap-2"
                            >
                              <Eye className="w-3 h-3" />
                              Visualizar
                            </button>
                            <button 
                              onClick={() => handleEdit(demand)}
                              className="w-full px-4 py-2 text-left text-[10px] font-bold text-[#141414] hover:bg-[#F3F4F6] flex items-center gap-2"
                            >
                              <Edit2 className="w-3 h-3" />
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDelete(demand.id)}
                              className="w-full px-4 py-2 text-left text-[10px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Excluir
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#141414] line-clamp-2 leading-tight mb-1">{demand.title}</h4>
                  <p className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wider">{demand.sector}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#F3F4F6]">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                        <Users className="w-3 h-3 text-[#6B7280]" />
                      </div>
                      <span className="text-xs font-medium text-[#6B7280]">{demand.assignedTo}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: getPriorityStyle(demand.priority).split('-')[1] }}>
                    <Flag className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-[#6B7280] px-2">
        <p>
          Mostrando {filteredDemands.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a {Math.min(currentPage * itemsPerPage, filteredDemands.length)} de {filteredDemands.length} demandas
        </p>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={cn(
              "px-3 py-1 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold transition-colors",
              currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-[#F9FAFB]"
            )}
          >
            Anterior
          </button>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={cn(
              "px-3 py-1 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold transition-colors",
              currentPage === totalPages || totalPages === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-[#F9FAFB]"
            )}
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Demand Details Modal */}
      <AnimatePresence>
        {selectedDemand && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDemand(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[#F3F4F6] flex items-center justify-between bg-[#141414] text-white">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Detalhes da Ocorrência</p>
                  <h3 className="text-xl font-bold">{selectedDemand.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedDemand(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="overflow-y-auto p-8 custom-scrollbar space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6]">
                    <p className="text-[10px] font-bold text-[#9CA3AF] uppercase mb-1">Protocolo</p>
                    <p className="text-sm font-mono font-bold text-[#141414]">{selectedDemand.protocol}</p>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6]">
                    <p className="text-[10px] font-bold text-[#9CA3AF] uppercase mb-1">Setor</p>
                    <p className="text-sm font-bold text-[#141414]">{selectedDemand.sector}</p>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6]">
                    <p className="text-[10px] font-bold text-[#9CA3AF] uppercase mb-1">Status</p>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", getStatusStyle(selectedDemand.status))}>
                      {selectedDemand.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6]">
                    <p className="text-[10px] font-bold text-[#9CA3AF] uppercase mb-1">Prioridade</p>
                    <span className={cn("text-xs font-bold", getPriorityStyle(selectedDemand.priority))}>
                      {selectedDemand.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Informações Adicionais</h5>
                  <p className="text-sm text-[#141414] leading-relaxed bg-[#F9FAFB] p-4 rounded-2xl border border-[#F3F4F6]">
                    Demanda registrada referente a {selectedDemand.title.toLowerCase()} no setor de {selectedDemand.sector.toLowerCase()}.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h5 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4">Responsável</h5>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#141414] text-white flex items-center justify-center font-bold">
                        {selectedDemand.assignedTo.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#141414]">{selectedDemand.assignedTo}</p>
                        <p className="text-xs text-[#9CA3AF]">Técnico Colaborador</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4">Prazo</h5>
                    <div className="flex items-center gap-3 text-[#141414]">
                      <Clock className="w-5 h-5 text-[#3B82F6]" />
                      <p className="text-sm font-bold">{format(new Date(selectedDemand.deadline || Date.now()), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#F3F4F6] flex gap-3">
                <button 
                  onClick={() => setSelectedDemand(null)}
                  className="flex-1 py-3 border border-[#E5E7EB] rounded-2xl font-bold text-sm text-[#6B7280] hover:bg-gray-50"
                >
                  Fechar Visualização
                </button>
                <button 
                  onClick={() => {
                    handleDelete(selectedDemand.id);
                    setSelectedDemand(null);
                  }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200"
                >
                  Excluir Registro
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
