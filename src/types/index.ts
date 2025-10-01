export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  role: 'reception' | 'viewer';
}

export interface Car {
  id: string;
  clientName: string;
  clientLastName: string;
  matricule: string;
  model: string;
  marque: string;
  assuranceCompany: string;
  typeReparation: string;
  kilometrage: number;
  dateArrivee: string;
  currentStatus: RepairStatus;
  chargee_de_dossier?: string;
  note?: string;
  statusHistory: StatusChange[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusChange {
  id: string;
  status: RepairStatus;
  changedAt: string;
  changedBy: string;
  notes?: string;
}

export type RepairStatus = 
  | 'En Attente de devis'
  | 'Attente accord de devis'
  | 'Devis accordé'
  | 'Attente pièce'
  | 'Pièce non dispo'
  | 'Au cours de réparation mécanique'
  | 'Au cours de réparation tôlerie'
  | 'Au cours de réparation électrique'
  | 'Prêt'
  | 'Sortie'

  ;

export type ViewMode = 'card' | 'table';

export interface CarFilters {
  search: string;
  marque: string;
  status: RepairStatus | '';
  chargeeDeDossier: string;
}