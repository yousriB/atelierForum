import { Car, RepairStatus } from '@/types';

export const calculateDaysInStatus = (car: Car): number => {
  const lastStatusChange = car.statusHistory[car.statusHistory.length - 1];
  const changeDate = new Date(lastStatusChange?.changedAt || car.createdAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - changeDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusColor = (status: RepairStatus, daysInStatus: number): string => {
  if (status === 'Prêt') return 'bg-status-ready text-white';
  if (daysInStatus > 3) return 'bg-status-danger text-white';
  if (daysInStatus > 0) return 'bg-status-warning text-white';
  return 'bg-status-info text-white';
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const getStatusBadgeVariant = (status: RepairStatus): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'Prêt':
      return 'default';
    case 'En Attente de devis':
    case 'Attente accord de devis':
    case 'Attente pièce':
    case 'Pièce non dispo':
      return 'destructive';
    default:
      return 'secondary';
  }
};