import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  TrendingUp, 
  Award, 
  Activity,
  ChevronRight,
  UserPlus,
  Download,
  Edit,
  Trash2,
  X,
  Mail,
  Smartphone,
  Shield,
  Briefcase,
  Database,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import { TeamMember } from '../types';

export default function TeamManager() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    sector: '',
    active: true
  });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTeam(data || []);
    } catch (err) {
      console.error('Error fetching team:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (memberToEdit) {
        const { error } = await supabase
          .from('team_members')
          .update({
            name: formData.name,
            role: formData.role,
            sector: formData.sector,
            active: formData.active
          })
          .eq('id', memberToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_members')
          .insert([{
            name: formData.name,
            role: formData.role,
            sector: formData.sector,
            active: true,
            performance_score: 100,
            tasks: 0
          }]);
        if (error) throw error;
      }
      await fetchTeam();
      setIsModalOpen(false);
      setMemberToEdit(null);
      setFormData({ name: '', role: '', sector: '', active: true });
    } catch (err) {
      console.error('Error saving member:', err);
      alert('Erro ao salvar colaborador.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja remover permanentemente este colaborador do sistema?')) return;
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setTeam(prev => prev.filter(m => m.id !== id));
      setSelectedMember(null);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const generatePDF = (member: TeamMember) => {
    const doc = new jsPDF() as any;
    const dateStr = new Date().toLocaleDateString('pt-BR');
    
    doc.setFontSize(22);
    doc.text(`RELATÓRIO: ${member.name.toUpperCase()}`, 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Operaional Intel - Núcleo de Gestão de Ativos`, 14, 32);
    doc.text(`Emissão: ${dateStr}`, 14, 38);

    const details = [
      ['ID Global', member.id],
      ['Colaborador', member.name],
      ['Cargo', member.role],
      ['Departamento', member.sector],
      ['Status', member.active ? 'Ativo' : 'Inativo'],
      ['Score de Performance', `${member.performanceScore || 100}%`],
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Campo', 'Valor Detalhado']],
      body: details,
      theme: 'striped',
      headStyles: { fillColor: [13, 13, 13], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 }
    });

    doc.save(`perfil_${member.name.toLowerCase().replace(/\s/g, '_')}.pdf`);
  };

  const filteredTeam = team.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header section with OpIntel design */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-[#141414] text-white text-[10px] font-bold tracking-[0.2em] rounded-sm uppercase">RECURSOS HUMANOS</div>
             <span className="text-[10px] font-bold text-[#9CA3AF] tracking-widest uppercase">Sistema de Alocação Operacional</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-[#0D0D0D] uppercase leading-none">Matriz de Equipe</h2>
          <p className="text-[#6B7280] text-sm max-w-lg leading-relaxed">
            Gestão centralizada de talentos e telemetria de performance. Monitore a eficiência do capital humano em tempo real.
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setMemberToEdit(null);
              setFormData({ name: '', role: '', sector: '', active: true });
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-[#0D0D0D] text-white text-[11px] font-bold tracking-widest uppercase hover:bg-black transition-all flex items-center gap-3 rounded-sm shadow-lg group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <UserPlus className="w-4 h-4" />
            <span className="relative z-10">Novo Operador</span>
          </button>
        </div>
      </section>

      {/* Quick Search & Filtering */}
      <section className="bg-white p-2 rounded-sm border border-[#E5E7EB] flex items-center gap-2 max-w-xl">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input 
            type="text" 
            placeholder="BUSCAR NA MATRIZ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-transparent text-[10px] font-bold tracking-widest uppercase outline-none placeholder:text-[#D1D5DB]"
          />
        </div>
        <button className="px-6 py-3 bg-[#F9FAFB] text-[10px] font-bold text-[#6B7280] uppercase tracking-widest hover:bg-[#F3F4F6] transition-colors rounded-sm">
           Filtros
        </button>
      </section>

      {/* Team Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 text-[#141414] animate-spin" />
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.3em]">Sincronizando com Matriz...</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTeam.map((member) => (
            <motion.div 
              key={member.id}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedMember(member)}
              className="bg-white p-8 rounded-sm border border-[#E5E7EB] relative group cursor-pointer hover:shadow-2xl hover:shadow-[#00000005] transition-all"
            >
              <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-[#141414] transition-all duration-300" />
              
              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 bg-[#141414] text-white flex items-center justify-center text-xl font-black rounded-sm tracking-tighter">
                  {getInitials(member.name)}
                </div>
                <div className="text-right">
                  <div className={cn(
                    "px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-sm border",
                    member.active ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                  )}>
                    {member.active ? 'Ativo' : 'Off-line'}
                  </div>
                </div>
              </div>

              <div className="space-y-1 mb-10">
                <h4 className="text-xl font-black text-[#0D0D0D] uppercase tracking-tighter leading-none group-hover:translate-x-1 transition-transform">{member.name}</h4>
                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">{member.role}</p>
              </div>

              <div className="pt-6 border-t border-[#F3F4F6] grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#D1D5DB] uppercase tracking-widest">Departamento</span>
                  <p className="text-[11px] font-black text-[#141414] uppercase">{member.sector}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#D1D5DB] uppercase tracking-widest">Score</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <p className="text-[11px] font-black text-[#141414]">{member.performanceScore || 100}%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredTeam.length === 0 && (
            <div className="col-span-full py-20 bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-sm text-center flex flex-col items-center gap-4">
              <Users className="w-10 h-10 text-[#D1D5DB]" />
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em]">Nenhum registro encontrado nesta zona.</p>
            </div>
          )}
        </section>
      )}

      {/* Modal - Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsModalOpen(false)}
              className="absolute inset-0 bg-[#0D0D0D]/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-white w-full max-w-lg rounded-sm shadow-2xl relative z-10 overflow-hidden flex flex-col border border-white/10"
            >
              <div className="p-10 border-b border-[#F3F4F6] flex items-center justify-between bg-[#FAFAFA]">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#9CA3AF]">
                    {memberToEdit ? 'Protocolo de Atualização' : 'Novo Alistamento'}
                  </span>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-[#0D0D0D]">
                    {memberToEdit ? 'Editar Dados' : 'Cadastrar Membro'}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#141414] rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-12 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white border border-[#E5E7EB] text-[#141414] rounded-sm px-4 py-3 text-xs font-bold uppercase tracking-wider focus:ring-1 focus:ring-[#141414] outline-none"
                    placeholder="EX: ROBERT C. MARTIN"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Cargo Operacional</label>
                    <input 
                      required
                      type="text" 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-white border border-[#E5E7EB] text-[#141414] rounded-sm px-4 py-3 text-xs font-bold uppercase tracking-wider focus:ring-1 focus:ring-[#141414] outline-none"
                      placeholder="EX: ANALISTA SENIOR"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Setor / Núcleo</label>
                    <select 
                      required
                      value={formData.sector}
                      onChange={e => setFormData({...formData, sector: e.target.value})}
                      className="w-full bg-white border border-[#E5E7EB] text-[#141414] rounded-sm px-4 py-3 text-xs font-bold uppercase tracking-wider focus:ring-1 focus:ring-[#141414] outline-none appearance-none cursor-pointer"
                    >
                      <option value="">SELECIONE</option>
                      <option value="TI">TI</option>
                      <option value="Logística">Logística</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Segurança">Segurança</option>
                      <option value="Infraestrutura">Infraestrutura</option>
                      <option value="Administração">Administração</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    disabled={isSaving}
                    type="submit"
                    className="w-full py-4 bg-[#0D0D0D] text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black rounded-sm transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 group"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        {memberToEdit ? 'Sincronizar Atualização' : 'Confirmar Alistamento'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Drawer - Details */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-[#0D0D0D]/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl bg-white h-full shadow-2xl relative z-10 flex flex-col border-l border-white/5"
            >
              <div className="p-12 border-b border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-[#141414] text-white flex items-center justify-center text-3xl font-black rounded-sm tracking-tighter">
                    {getInitials(selectedMember.name)}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#9CA3AF]">PERFIL SINCRONIZADO</span>
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-[#0D0D0D]">{selectedMember.name}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="p-3 bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                 <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-2">
                       <span className="text-[10px] font-bold text-[#D1D5DB] uppercase tracking-[0.2em]">Status de Rede</span>
                       <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", selectedMember.active ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                          <span className="text-xs font-bold text-[#141414] uppercase tracking-widest">{selectedMember.active ? 'Operacional' : 'Ausente'}</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-bold text-[#D1D5DB] uppercase tracking-[0.2em]">Identificador</span>
                       <p className="text-xs font-mono font-bold text-[#6B7280]">#{selectedMember.id.slice(0,8).toUpperCase()}</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-[#0D0D0D] uppercase tracking-[0.3em] border-b border-[#F3F4F6] pb-4">Indicadores de Performance</h5>
                    <div className="grid grid-cols-1 gap-6">
                       <div className="bg-[#F9FAFB] p-8 border border-[#E5E7EB] rounded-sm space-y-6">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                <span className="text-xs font-bold uppercase tracking-widest text-[#141414]">Eficiência Operacional</span>
                             </div>
                             <span className="text-2xl font-black font-mono">{selectedMember.performanceScore || 100}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${selectedMember.performanceScore || 100}%` }}
                                className="h-full bg-[#141414]"
                             />
                          </div>
                       </div>

                       <div className="bg-[#F9FAFB] p-8 border border-[#E5E7EB] rounded-sm flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white border border-[#E5E7EB] flex items-center justify-center rounded-sm">
                                <Activity className="w-6 h-6 text-[#141414]" />
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-[#D1D5DB] uppercase tracking-widest">Carga Atual</p>
                                <p className="text-sm font-black text-[#141414] uppercase">Saturação Média</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xl font-black font-mono">08</p>
                             <p className="text-[9px] font-bold text-[#9CA3AF] uppercase">Unidades</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-[#0D0D0D] uppercase tracking-[0.3em] border-b border-[#F3F4F6] pb-4">Painel de Ações</h5>
                    <div className="grid grid-cols-2 gap-4">
                       <button 
                          onClick={() => {
                            setMemberToEdit(selectedMember);
                            setFormData({
                              name: selectedMember.name,
                              role: selectedMember.role,
                              sector: selectedMember.sector,
                              active: selectedMember.active
                            });
                            setIsModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-3 py-4 border border-[#E5E7EB] text-[10px] font-bold uppercase tracking-widest hover:bg-[#F9FAFB] transition-all rounded-sm"
                       >
                          <Edit className="w-4 h-4" />
                          Modificar
                       </button>
                       <button 
                          onClick={() => handleDelete(selectedMember.id)}
                          className="flex items-center justify-center gap-3 py-4 border border-red-100 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all rounded-sm"
                       >
                          <Trash2 className="w-4 h-4" />
                          Exterminar
                       </button>
                    </div>
                 </div>
              </div>

               <div className="p-12 bg-[#FAFAFA] border-t border-[#F3F4F6]">
                <button 
                  onClick={() => generatePDF(selectedMember)}
                  className="w-full py-5 bg-[#0D0D0D] text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-black rounded-sm transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3"
                >
                  <Download className="w-5 h-5" />
                  Gerar Dossiê em PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
