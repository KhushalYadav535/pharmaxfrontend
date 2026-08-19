import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...opts,
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
}

export function formatRole(role: string): string {
  const map: Record<string, string> = {
    MR: 'Medical Representative',
    TRADE_REP: 'Trade Representative',
    DISTRIBUTOR_REP: 'Distributor Sales Rep',
    ASM: 'Area Sales Manager',
    RSM: 'Regional Sales Manager',
    ZM: 'Zonal Manager',
    NSM: 'National Sales Manager',
    PRODUCT_MANAGER: 'Product Manager',
    MARKETING: 'Marketing',
    SALES_ADMIN: 'Sales Admin',
    SUPER_ADMIN: 'Super Admin',
  };
  return map[role] || role;
}

export const CLASSIFICATION_COLORS: Record<string, string> = {
  A_PLUS: 'bg-emerald-100 text-emerald-800',
  A: 'bg-blue-100 text-blue-800',
  B: 'bg-yellow-100 text-yellow-800',
  C: 'bg-gray-100 text-gray-600',
};

export const VISIT_STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  MISSED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export const APPROVAL_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};
