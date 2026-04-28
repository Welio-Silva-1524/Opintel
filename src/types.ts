export enum DemandStatus {
  PENDENTE = "PENDENTE",
  EM_ANDAMENTO = "EM_ANDAMENTO",
  FINALIZADO = "FINALIZADO",
  URGENTE = "URGENTE",
}

export enum DemandPriority {
  BAIXA = "BAIXA",
  MEDIA = "MEDIA",
  ALTA = "ALTA",
  CRITICA = "CRITICA",
}

export enum ActivityType {
  TAREFA = "TAREFA",
  INSPECAO = "INSPECAO",
  VISITA = "VISITA",
}

export interface Demand {
  id: string;
  title: string;
  description: string;
  status: DemandStatus;
  priority: DemandPriority;
  sector: string;
  teamId?: string;
  assignedTo?: string;
  responsible_id?: string;
  createdAt: number;
  updatedAt: number;
  deadline?: number;
  protocol: string;
  date?: string | Date;
  created_at?: string;
}

export interface Evidence {
  id: string;
  demandId: string;
  type: "PHOTO" | "DOC" | "TEXT";
  url?: string;
  content?: string;
  description: string;
  createdAt: number;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  date: number;
  status: "PENDENTE" | "CONCLUIDA" | "ATRASADA";
  assigneeId?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  sector: string;
  active: boolean;
  status?: string;
  performance_score?: number;
  performanceScore?: number; // Keep for backward compatibility if needed
  tasks?: number;
}

export interface OperationalReport {
  id: string;
  name: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY";
  generatedAt: number;
  data: any;
}
