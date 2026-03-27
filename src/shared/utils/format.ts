export const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export const formatDate = (date: any): string => {
  if (!date) return 'N/A';
  
  // Firebase Timestamp
  if (date.toDate && typeof date.toDate === 'function') {
    return date.toDate().toLocaleDateString('vi-VN');
  }
  
  // API JSON Timestamp { seconds, nanoseconds }
  if (date.seconds !== undefined) {
    return new Date(date.seconds * 1000).toLocaleDateString('vi-VN');
  }
  
  // String or Date object
  const d = new Date(date);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('vi-VN');
};

export const formatDateTime = (date: any): string => {
  if (!date) return 'N/A';
  
  let d: Date;
  if (date.toDate && typeof date.toDate === 'function') {
    d = date.toDate();
  } else if (date.seconds !== undefined) {
    d = new Date(date.seconds * 1000);
  } else {
    d = new Date(date);
  }
  
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatTime = (date: any): string => {
  if (!date) return 'N/A';
  
  let d: Date;
  if (date.toDate && typeof date.toDate === 'function') {
    d = date.toDate();
  } else if (date.seconds !== undefined) {
    d = new Date(date.seconds * 1000);
  } else {
    d = new Date(date);
  }
  
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
