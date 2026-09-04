import React, { useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// Hook to use toasts anywhere
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return { toasts, addToast };
}

// Toast container component
export function ToastContainer({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 size={18} />,
    error: <AlertTriangle size={18} />,
    info: <Info size={18} />,
  };

  const colors = {
    success: 'var(--accent-emerald)',
    error: 'var(--yazaki-red)',
    info: 'var(--accent-blue)',
  };

  return (
    <div style={{
      position: 'fixed', top: '1.5rem', right: '1.5rem',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem'
    }}>
      {toasts.map(t => (
        <div key={t.id} className="toast-item" style={{ '--toast-color': colors[t.type] }}>
          <span style={{ color: colors[t.type] }}>{icons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
