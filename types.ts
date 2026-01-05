
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
  startDate: string;
  dueDate: string;
  serviceType: string;
  budget: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
  tasks: ProjectTask[];
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
  city?: string;
  state?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  billingType: 'monthly' | 'one_time';
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
}

export interface CRMItem {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: 'ads' | 'referral' | 'organic' | 'outbound';
  service: string;
  status: LeadStatus;
  value: number;
  expectedCloseDate: string;
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
