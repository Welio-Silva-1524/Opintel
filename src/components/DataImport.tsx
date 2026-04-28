import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  File as FileIcon, 
  X, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { analyzeDataFile, analyzeDataText } from '../services/geminiService';
import * as XLSX from 'xlsx';
import { Demand, DemandPriority, DemandStatus } from '../types';
import { supabase } from '../lib/supabase';

interface DataImportProps {
  demands: Demand[];
  setDemands: React.Dispatch<React.SetStateAction<Demand[]>>;
  onImportComplete?: () => void;
}

export default function DataImport({ demands, setDemands, onImportComplete }: DataImportProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedResult, setExtractedResult] = useState<any>(null);
  const [isImported, setIsImported] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    setIsImported(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt']
    }
  } as any);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const mapPriority = (p: string): DemandPriority => {
    const priority = p.toUpperCase();
    if (priority.includes('CRITICA')) return DemandPriority.CRITICA;
    if (priority.includes('ALTA')) return DemandPriority.ALTA;
    if (priority.includes('BAIXA')) return DemandPriority.BAIXA;
    return DemandPriority.MEDIA;
  };

  const handleConfirmImport = async () => {
    if (!extractedResult || !extractedResult.extractedData) return;
    setIsAnalyzing(true);

    try {
      const dbData = extractedResult.extractedData.map((item: any) => ({
        title: item.title || 'Demanda Importada',
        description: item.description || '',
        sector: item.sector || 'Geral',
        priority: item.priority || 'MEDIA',
        status: 'Aguardando',
        date: item.date || null
      }));

      const { error } = await supabase
        .from('demands')
        .insert(dbData);
      
      if (error) throw error;

      setIsImported(true);
      setFiles([]);
      setExtractedResult(null);
      if (onImportComplete) onImportComplete();
    } catch (err) {
      console.error('Error importing demands:', err);
      alert('Falha ao importar dados para o banco.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setExtractedResult(null);

    const prompt = "Extraia todas as demandas operacionais identificáveis deste arquivo. Para cada demanda, identifique: título (curto e profissional), descrição (contextual), setor (ex: Manutenção, TI, Logística), prioridade (Baixa, Média, Alta ou Crítica) e data de execução. Se for uma lista curta ou anotação informal, tente preencher os dados por dedução lógica. Retorne um JSON com a lista 'extractedData' contendo objetos com {title, description, sector, priority, date}.";

    try {
      const file = files[0];
      
      // Handle Excel files separately using XLSX library
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          
          try {
            const result = await analyzeDataText(csv, prompt);
            setExtractedResult(result);
          } catch (err) {
            console.error("Gemini text analysis failed", err);
          }
          setIsAnalyzing(false);
        };
        reader.readAsBinaryString(file);
        return;
      }

      // Handle Text/CSV as text directly
      if (file.type === 'text/plain' || file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result as string;
          try {
            const result = await analyzeDataText(text, prompt);
            setExtractedResult(result);
          } catch (err) {
            console.error("Gemini text analysis failed", err);
          }
          setIsAnalyzing(false);
        };
        reader.readAsText(file);
        return;
      }

      // Handle PDF and Images using Gemini's native file support
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const result = await analyzeDataFile(base64, file.type, prompt);
          setExtractedResult(result);
        } catch (err) {
          console.error("Gemini file analysis failed", err);
        }
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error("Analysis failed", error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      <div className="space-y-4">
        <h2 className="text-4xl font-extrabold tracking-tighter text-[#0D0D0D] uppercase">NÚCLEO DE INGESTÃO</h2>
        <div className="h-1 w-20 bg-[#141414]" />
        <p className="text-[#6B7280] text-sm max-w-xl leading-relaxed">
          Sincronização de documentos operacionais via Redes Neurais. Arraste arquivos ou cole texto bruto para conversão estruturada.
        </p>
      </div>

      <AnimatePresence>
        {isImported && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#0D0D0D] text-white p-6 rounded-sm flex items-center gap-6 shadow-2xl"
          >
            <div className="w-12 h-12 bg-white/10 rounded-sm flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-bold">Operação Concluída</p>
              <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Registros persistidos no banco de dados central.</p>
            </div>
            <button 
              onClick={() => setIsImported(false)}
              className="ml-auto p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropzone & Paste Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div 
          {...getRootProps()} 
          className={cn(
            "border border-[#E5E7EB] rounded-sm p-12 transition-all cursor-crosshair flex flex-col items-center justify-center gap-6 min-h-[350px] relative group overflow-hidden",
            isDragActive ? "bg-[#141414]" : "bg-white hover:bg-[#F9FAFB]"
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
          <input {...getInputProps()} />
          <div className={cn(
            "w-20 h-20 rounded-sm flex items-center justify-center border transition-all duration-500",
            isDragActive ? "bg-white border-white rotate-90" : "bg-[#F3F4F6] border-[#E5E7EB] group-hover:bg-[#141414]"
          )}>
            <Upload className={cn("w-8 h-8 transition-colors duration-500", isDragActive ? "text-[#141414]" : "text-[#9CA3AF] group-hover:text-white")} />
          </div>
          <div className="text-center relative z-10">
            <p className={cn("text-[10px] font-bold uppercase tracking-[0.3em] transition-colors", isDragActive ? "text-white" : "text-[#141414]")}>
              {isDragActive ? "SOLTAR ARQUIVOS" : "ARRASTAR DOCUMENTOS"}
            </p>
            <p className={cn("text-[9px] uppercase tracking-widest mt-3 transition-colors", isDragActive ? "text-white/50" : "text-[#6B7280]")}>
              PDF • XLSX • PNG • CSV • TXT
            </p>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-[#E5E7EB] p-10 flex flex-col gap-6 relative shadow-sm">
          <div className="flex items-center gap-3 text-[#141414]">
            <div className="w-2 h-2 bg-[#141414]" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest">Entrada de Texto Bruto</h3>
          </div>
          <textarea 
            placeholder="COLE NOTAS, TRANSCRIÇÕES OU RECADOS AQUI..."
            className="flex-1 w-full p-6 bg-[#F3F4F6] border-none rounded-sm text-[11px] font-mono leading-relaxed focus:ring-1 focus:ring-[#141414] resize-none min-h-[180px] uppercase placeholder:text-[#9CA3AF]"
            id="manual-text-input"
          />
          <button 
            onClick={async () => {
              const text = (document.getElementById('manual-text-input') as HTMLTextAreaElement).value;
              if (!text.trim()) return;
              setIsAnalyzing(true);
              setExtractedResult(null);
              const prompt = "Extraia todas as demandas operacionais citadas. Para cada uma, identifique: título (curto e objetivo), descrição (detalhada), setor, prioridade e data. Se o texto for curto, preencha os campos com base no que for possível inferir. Retorne um JSON com a lista 'extractedData'.";
              try {
                const result = await analyzeDataText(text, prompt);
                setExtractedResult(result);
              } catch (err) {
                console.error(err);
              }
              setIsAnalyzing(false);
            }}
            disabled={isAnalyzing}
            className="w-full bg-[#141414] text-white py-4 rounded-sm text-[11px] font-bold tracking-[0.3em] uppercase flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50 group active:scale-[0.98]"
          >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
            ANÁLISE SINTÉTICA
          </button>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden"
          >
            <div className="p-4 border-b border-[#F3F4F6] bg-[#F9FAFB] flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">{files.length} arquivos selecionados</span>
              <button 
                onClick={() => setFiles([])}
                className="text-xs font-bold text-[#EF4444] hover:underline"
              >
                Limpar tudo
              </button>
            </div>
            <div className="divide-y divide-[#F3F4F6]">
              {files.map((file, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    {file.type.includes('image') ? <ImageIcon className="w-5 h-5 text-blue-500" /> : <FileText className="w-5 h-5 text-orange-500" />}
                    <div>
                      <p className="text-sm font-bold text-[#141414] truncate max-w-[300px]">{file.name}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(idx)}
                    className="p-1.5 hover:bg-[#FEE2E2] hover:text-[#EF4444] rounded-lg transition-colors text-[#9CA3AF]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 bg-[#F9FAFB] border-t border-[#F3F4F6]">
              <button 
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                className="w-full bg-[#141414] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analisando dados com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Consolidar via Inteligência Artificial
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Result */}
      <AnimatePresence>
        {extractedResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="bg-[#141414] p-6 rounded-3xl text-white shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Consolidação Finalizada</h3>
                  <p className="text-white/60 text-sm">IA extraiu {extractedResult.extractedData?.length || 0} registros operacionais com sucesso.</p>
                </div>
              </div>
              <button 
                onClick={handleConfirmImport}
                className="bg-white text-[#141414] px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#F3F4F6] transition-colors"
              >
                Confirmar Importação
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {extractedResult.extractedData?.map((item: any, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#141414] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase truncate max-w-[120px]">{item.sector || 'Geral'}</span>
                    <span className="text-[10px] text-[#9CA3AF] font-medium">{item.date || 'Data não identificada'}</span>
                  </div>
                  <h4 className="font-bold text-[#141414] mb-1 line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

            {extractedResult.summary && (
              <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl">
                <div className="flex items-center gap-2 text-orange-800 font-bold mb-2">
                  <Info className="w-4 h-4" />
                  <span>Resumo Operacional da IA</span>
                </div>
                <p className="text-sm text-orange-900 leading-relaxed italic opacity-80">
                  "{extractedResult.summary}"
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
