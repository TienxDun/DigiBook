export const parseDateVN = (dateStr?: string | null): Date => {
  if (!dateStr) return new Date();

  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }

  return new Date(dateStr);
};

export const getEntityTimestamp = (value: { createdAt?: any; date?: string }): number => {
  if (value.createdAt?.toDate) return value.createdAt.toDate().getTime();
  if (value.createdAt) return new Date(value.createdAt).getTime();
  if (value.date) return parseDateVN(value.date).getTime();
  return 0;
};

export const formatDateVN = (value?: any, fallback?: string): string => {
  if (!value) return fallback || 'N/A';

  const dateObj = value?.toDate && typeof value.toDate === 'function'
    ? value.toDate()
    : new Date(value);

  if (Number.isNaN(dateObj.getTime())) return fallback || 'N/A';
  return dateObj.toLocaleDateString('vi-VN');
};
