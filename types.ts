
export enum LeadStatus {
  NEW = 'Novo',
  CONTACTED = 'Contatado',
  QUALIFIED = 'Qualificado',
  PROPOSAL = 'Proposta',
  NEGOTIATION = 'Negociação',
  CLOSED = 'Fechado',
  LOST = 'Perdido'
}

export interface ProjectTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  clientEmail: string;
  progress: number;
  status: 'active' | 'completed' | 'on_hold';
  dueDate: string;
  serviceType: string;
  description?: string;
  tasks: ProjectTask[];
  leadId?: string;
  clientId?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  phone2?: string;
  cpf?: string;
  cnpj?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  avatar?: string;
  totalInvested: number;
  activeProjects: number;
  status: 'active' | 'inactive';
}

export interface FinanceTransaction {
  id: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  status: 'paid' | 'pending';
  clientId?: string;
  projectId?: string;
}

export interface CRMItem {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  cpf: string;
  cnpj: string;
  service: string;
  status: LeadStatus;
  value: string;
  tag: string;
  createdAt: string;
  notes?: string;
}

export enum Page {
  DASHBOARD = 'dashboard',
  CRM = 'crm',
  FINANCE = 'finance',
  SERVICES = 'services',
  PROJECTS = 'projects',
  CLIENTS = 'clients'
}
