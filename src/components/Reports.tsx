import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Clock, 
  FileSpreadsheet, 
  File as FileIcon, 
  Calendar,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Database,
  Loader2,
  PieChart,
  BarChart as BarChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { Demand, TeamMember } from '../types';
import { subDays, isAfter, parseISO, startOfDay, format as formatDateFn } from 'date-fns';

export default function Reports() {
  const [reports, setReports] = useState<{id: string, name: string, date: string, type: string, size: string}[]>([
    { id: '1', name: 'Relatório Operacional Diário', date: '28 Abr 2024', type: 'PDF', size: '1.2 MB' },
    { id: '2', name: 'Produtividade da Equipe', date: '25 Abr 2024', type: 'XLSX', size: '4.5 MB' },
  ]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState('Produtividade da Equipe');
  const [period, setPeriod] = useState('Últimos 7 dias');
  const [format, setFormat] = useState('PDF');
  
  const [demands, setDemands] = useState<Demand[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [demandsRes, teamRes] = await Promise.all([
        supabase.from('demands').select('*'),
        supabase.from('team_members').select('*')
      ]);

      if (demandsRes.error) throw demandsRes.error;
      if (teamRes.error) throw teamRes.error;

      setDemands(demandsRes.data || []);
      setTeam(teamRes.data || []);
    } catch (err) {
      console.error('Error fetching data for reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredData = () => {
    let days = 7;
    if (period === 'Últimos 30 dias') days = 30;
    const cutoff = startOfDay(subDays(new Date(), days));
    
    return demands.filter(d => {
      const dateVal = d.date || d.created_at || '';
      const dDate = dateVal instanceof Date ? dateVal : parseISO(dateVal);
      return isAfter(dDate, cutoff);
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate complex data processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newReport = {
      id: Math.random().toString(36).substr(2, 9),
      name: reportType,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: format === 'Excel' ? 'XLSX' : format,
      size: `${(Math.random() * 2 + 1).toFixed(1)} MB`
    };
    
    setReports(prev => [newReport, ...prev]);
    setIsGenerating(false);
    
    // Auto-download the newly generated report
    handleDownload(newReport);
  };

  const handleDownload = (report: any) => {
    const reportNameLower = report.name.toLowerCase();
    const fileName = `relatorio_${report.name.toLowerCase().replace(/\s/g, '_')}_${formatDateFn(new Date(), 'yyyyMMdd')}`;
    const filteredDemands = getFilteredData();

    let reportData: any[] = [];
    let headers: string[] = [];
    let sectionTitle = report.name;

    if (reportNameLower.includes('produtividade')) {
      headers = ['Colaborador', 'Cargo', 'Setor', 'Status', 'Demandas', 'Performance (%)'];
      reportData = team.map(m => {
        const memberDemands = demands.filter(d => d.responsible_id === m.id);
        return [
          m.name, 
          m.role || 'Operacional',
          m.sector, 
          m.status || 'Ativo',
          memberDemands.length.toString(), 
          `${m.performanceScore || 100}%`
        ];
      });
    } else if (reportNameLower.includes('sla') || reportNameLower.includes('resposta')) {
      headers = ['Protocolo', 'Título', 'Setor', 'Prioridade', 'Status', 'Data Início', 'Vencimento'];
      reportData = filteredDemands.map(d => [
        d.protocol || d.id.slice(0, 8), 
        d.title, 
        d.sector, 
        d.priority, 
        d.status, 
        d.date || '-',
        d.deadline || '-'
      ]);
    } else if (reportNameLower.includes('volume') || reportNameLower.includes('setor')) {
      const sectors = [...new Set(demands.map(d => d.sector))];
      headers = ['Setor', 'Total Demandas', 'Concluídos', 'Aguardando', 'Taxa de Entrega'];
      reportData = sectors.map(s => {
        const sectorDemands = demands.filter(d => d.sector === s);
        const completed = sectorDemands.filter(d => d.status === 'FINALIZADO').length;
        const waiting = sectorDemands.filter(d => d.status !== 'FINALIZADO').length;
        const rate = sectorDemands.length > 0 ? ((completed / sectorDemands.length) * 100).toFixed(1) + '%' : '0%';
        return [s, sectorDemands.length.toString(), completed.toString(), waiting.toString(), rate];
      });
    } else {
      // General/History
      headers = ['Data', 'Protocolo', 'Evento', 'Setor', 'Prioridade', 'Status'];
      reportData = filteredDemands.map(d => [
        d.date || '-',
        d.protocol || '-',
        d.title, 
        d.sector, 
        d.priority,
        d.status
      ]);
    }

    if (report.type === 'PDF') {
      const doc = new jsPDF() as any;
      
      // Header
      doc.setFillColor(13, 13, 13);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("OPINTEL", 14, 20);
      doc.setFontSize(10);
      doc.text("OPERATIONAL INTELLIGENCE SYSTEM", 14, 28);
      
      doc.setFontSize(14);
      doc.text(sectionTitle.toUpperCase(), 120, 20);
      doc.setFontSize(8);
      doc.text(`GERADO EM: ${new Date().toLocaleString('pt-BR')}`, 120, 28);
      doc.text(`PERÍODO: ${period.toUpperCase()}`, 120, 34);

      autoTable(doc, {
        startY: 50,
        head: [headers],
        body: reportData,
        theme: 'striped',
        headStyles: { fillColor: [13, 13, 13], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 14, right: 14 }
      });
      
      doc.save(`${fileName}.pdf`);
    } 
    else if (report.type === 'XLSX') {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...reportData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dados Operacionais");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } 
    else {
      // TXT
      const title = `OPINTEL - RELATÓRIO OPERACIONAL\n${"=".repeat(50)}\n`;
      const info = `TIPO: ${report.name.toUpperCase()}\nDATA: ${new Date().toLocaleString('pt-BR')}\nPERÍODO: ${period}\n${"=".repeat(50)}\n\n`;
      const tableHead = headers.map(h => h.padEnd(25)).join('|') + "\n" + "-".repeat(headers.length * 26) + "\n";
      const tableBody = reportData.map(row => row.map((cell: any) => String(cell).padEnd(25)).join('|')).join('\n');
      
      const content = title + info + tableHead + tableBody;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.txt`;
      link.click();
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-[#141414] text-white text-[10px] font-bold tracking-[0.2em] rounded-sm uppercase">DATA & ANALYTICS</div>
             <span className="text-[10px] font-bold text-[#9CA3AF] tracking-widest uppercase">Inteligência Operacional Hub</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-[#0D0D0D] uppercase leading-none">Relatórios</h2>
          <p className="text-[#6B7280] text-sm max-w-lg leading-relaxed">
            Consolidação de dados táticos e estratégicos. Gere documentos de alta precisão para suporte à decisão.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-sm border border-[#E5E7EB] shadow-sm">
            <h3 className="text-sm font-black text-[#0D0D0D] uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
              <Database className="w-5 h-5" />
              Parâmetros de Geração
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Dimensão de Dados</label>
                <select 
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-sm px-4 py-4 text-xs font-bold uppercase tracking-widest text-[#141414] focus:ring-1 focus:ring-[#141414] outline-none appearance-none cursor-pointer"
                >
                  <option>Produtividade da Equipe</option>
                  <option>Tempo de Resposta (SLA)</option>
                  <option>Volume de Demandas por Setor</option>
                  <option>Histórico Geral de Ocorrências</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Janela Temporal</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <select 
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-sm text-xs font-bold uppercase tracking-widest text-[#141414] focus:ring-1 focus:ring-[#141414] outline-none appearance-none cursor-pointer"
                  >
                    <option>Últimos 7 dias</option>
                    <option>Últimos 30 dias</option>
                    <option>Semestre Atual</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-12">
               <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Formato de Saída</label>
               <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'PDF', icon: FileIcon, label: 'Documento PDF' },
                    { id: 'Excel', icon: FileSpreadsheet, label: 'Tabela Excel' },
                    { id: 'TXT', icon: FileText, label: 'Texto Plano' }
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setFormat(fmt.id)}
                      className={cn(
                        "flex flex-col items-center gap-4 p-6 rounded-sm border transition-all group",
                        format === fmt.id 
                          ? "bg-[#141414] border-[#141414] text-white" 
                          : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#141414]"
                      )}
                    >
                      <fmt.icon className={cn("w-6 h-6", format === fmt.id ? "text-white" : "text-[#D1D5DB] group-hover:text-[#141414]")} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{fmt.id}</span>
                    </button>
                  ))}
               </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || isLoading}
              className="w-full py-5 bg-[#0D0D0D] text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-black rounded-sm transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-4 disabled:opacity-50 group"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processando Motor de Dados...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  <span>Gerar e Baixar Relatório</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#141414] p-8 rounded-sm text-white space-y-4 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <PieChart className="w-24 h-24" />
               </div>
               <div className="flex items-center gap-2 text-white/40">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Insight Sugerido</span>
               </div>
               <h4 className="text-xl font-black uppercase tracking-tighter leading-tight relative z-10">Setor de segurança reduziu 15% nos incidentes críticos.</h4>
            </div>
            <div className="bg-[#3B82F6] p-8 rounded-sm text-white space-y-4 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <BarChartIcon className="w-24 h-24" />
               </div>
               <div className="flex items-center gap-2 text-white/40">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Alerta de Performance</span>
               </div>
               <h4 className="text-xl font-black uppercase tracking-tighter leading-tight relative z-10">Tempo médio de resposta em TI excedeu meta em 4%.</h4>
            </div>
          </div>
        </div>

        {/* History Area */}
        <div className="space-y-6">
          <div className="bg-[#F9FAFB] p-8 border border-[#E5E7EB] rounded-sm">
            <h3 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.3em] mb-8">Repositório de Saídas</h3>
            
            <div className="space-y-4">
              {reports.slice(0, showAllHistory ? 10 : 5).map((report) => (
                <div key={report.id} className="bg-white p-6 border border-[#E5E7EB] rounded-sm flex flex-col gap-4 group hover:border-[#141414] transition-all cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-[#F3F4F6] flex items-center justify-center rounded-sm text-[#141414] group-hover:bg-[#141414] group-hover:text-white transition-colors">
                       <FileIcon className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] font-black uppercase bg-[#F3F4F6] px-2 py-0.5 rounded-sm text-[#6B7280]">
                          {report.type}
                       </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0D0D0D] uppercase tracking-tight mb-1">{report.name}</h4>
                    <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">{report.date} • {report.size}</p>
                  </div>
                  <button 
                    onClick={() => handleDownload(report)}
                    className="flex items-center gap-2 text-[10px] font-bold text-[#3B82F6] hover:text-[#2563EB] transition-colors uppercase tracking-widest"
                  >
                    <Download className="w-3 h-3" />
                    Baixar Arquivo
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="w-full mt-8 py-4 border border-dashed border-[#D1D5DB] rounded-sm text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest hover:border-[#141414] hover:text-[#141414] transition-all"
            >
              {showAllHistory ? "Ocultar Log" : "Ver Todo o Histórico"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
