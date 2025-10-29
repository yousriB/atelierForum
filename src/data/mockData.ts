import { Car, User, RepairStatus } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'reception@showroom.com',
    name: 'Marie',
    lastName: 'Dubois',
    role: 'reception',
    password: 'password'
  },
  {
    id: '2',
    email: 'manager@showroom.com',
    name: 'Jean',
    lastName: 'Martin',
    role: 'viewer',
    password: 'password'
  }
];

export const carMarques = [
  'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Peugeot', 
  'Renault', 'Citroën', 'Toyota', 'Nissan', 'Ford'
];

export const assuranceCompanies = [
  'AXA', 'Allianz', 'Generali', 'MAIF', 'MACIF', 'MMA', 'Groupama'
];

export const repairTypes = [
  'Réparation mécanique',
  'Réparation tôlerie',
  'Réparation électrique',
];

export const repairStatuses: RepairStatus[] = [
  'En cours de montage',
  'En Attente de devis',
  'Attente accord de devis',
  'Devis accordé',
  'Attente pièce',
  'Pièce non dispo',
  'Au cours de réparation mécanique',
  'Au cours de réparation tôlerie',
  'Au cours de réparation électrique',
  'Prêt',
  'Réparation annulé',
  'Epave',
  'Sortie'
];