import { Car, User, RepairStatus } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'reception@showroom.com',
    name: 'Marie',
    lastName: 'Dubois',
    role: 'reception'
  },
  {
    id: '2',
    email: 'manager@showroom.com',
    name: 'Jean',
    lastName: 'Martin',
    role: 'viewer'
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
  'En Attente de devis',
  'Attente accord de devis',
  'Devis accordé',
  'Attente pièce',
  'Pièce non dispo',
  'Au cours de réparation mécanique',
  'Au cours de réparation tôlerie',
  'Au cours de réparation électrique',
  'Prêt',
  'Sortie'
];

// export const mockCars: Car[] = [
//   {
//     id: '1',
//     clientName: 'Pierre',
//     clientLastName: 'Dupont',
//     matricule: 'AB-123-CD',
//     model: 'Serie 3',
//     marque: 'BMW',
//     assuranceCompany: 'AXA',
//     typeReparation: 'Réparation mécanique',
//     kilometrage: 85000,
//     dateArrivee: '2024-01-15',
//     currentStatus: 'Au cours de réparation mécanique',
//     statusHistory: [
//       {
//         id: '1',
//         status: 'En Attente de devis',
//         changedAt: '2024-01-15T09:00:00Z',
//         changedBy: 'Marie Dubois'
//       },
//       {
//         id: '2',
//         status: 'Devis accord',
//         changedAt: '2024-01-16T14:30:00Z',
//         changedBy: 'Marie Dubois'
//       },
//       {
//         id: '3',
//         status: 'Au cours de réparation mécanique',
//         changedAt: '2024-01-18T08:15:00Z',
//         changedBy: 'Marie Dubois'
//       }
//     ],
//     createdAt: '2024-01-15T09:00:00Z',
//     updatedAt: '2024-01-18T08:15:00Z'
//   },
//   {
//     id: '2',
//     clientName: 'Sophie',
//     clientLastName: 'Martin',
//     matricule: 'EF-456-GH',
//     model: 'C-Class',
//     marque: 'Mercedes-Benz',
//     assuranceCompany: 'Allianz',
//     typeReparation: 'Réparation tôlerie',
//     kilometrage: 62000,
//     dateArrivee: '2024-01-20',
//     currentStatus: 'Prêt',
//     statusHistory: [
//       {
//         id: '4',
//         status: 'En Attente de devis',
//         changedAt: '2024-01-20T10:00:00Z',
//         changedBy: 'Marie Dubois'
//       },
//       {
//         id: '5',
//         status: 'Devis accord',
//         changedAt: '2024-01-21T11:00:00Z',
//         changedBy: 'Marie Dubois'
//       },
//       {
//         id: '6',
//         status: 'Au cours de réparation tôlerie',
//         changedAt: '2024-01-22T09:00:00Z',
//         changedBy: 'Marie Dubois'
//       },
//       {
//         id: '7',
//         status: 'Prêt',
//         changedAt: '2024-01-25T16:30:00Z',
//         changedBy: 'Marie Dubois'
//       }
//     ],
//     createdAt: '2024-01-20T10:00:00Z',
//     updatedAt: '2024-01-25T16:30:00Z'
//   },
//   {
//     id: '3',
//     clientName: 'Michel',
//     clientLastName: 'Bernard',
//     matricule: 'IJ-789-KL',
//     model: 'A4',
//     marque: 'Audi',
//     assuranceCompany: 'Generali',
//     typeReparation: 'Réparation électrique',
//     kilometrage: 45000,
//     dateArrivee: '2024-01-10',
//     currentStatus: 'Attente pièce',
//     statusHistory: [
//       {
//         id: '8',
//         status: 'En Attente de devis',
//         changedAt: '2024-01-10T14:00:00Z',
//         changedBy: 'Marie Dubois'
//       },
//       {
//         id: '9',
//         status: 'Devis accord',
//         changedAt: '2024-01-12T10:00:00Z',
//         changedBy: 'Marie Dubois'
//       },
//       {
//         id: '10',
//         status: 'Attente pièce',
//         changedAt: '2024-01-13T15:00:00Z',
//         changedBy: 'Marie Dubois'
//       }
//     ],
//     createdAt: '2024-01-10T14:00:00Z',
//     updatedAt: '2024-01-13T15:00:00Z'
//   }
// ];