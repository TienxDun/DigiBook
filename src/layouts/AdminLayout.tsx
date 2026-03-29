import React from 'react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
};

export default AdminLayout;
