import { useState, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
    </svg>
  ),
};

const COLORS = {
  success: 'bg-green-500',
  error:   'bg-red-500',
  warning: 'bg-orange-500',
  info:    'bg-[#f97316]',
};

function ToastItem({ toast, onRemove }) {
  // auto-dismiss
  useState(() => {
    const t = setTimeout(() => onRemove(toast.id), toast.duration ?? 3500);
    return () => clearTimeout(t);
  });

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl text-white
        min-w-[280px] max-w-sm pointer-events-auto
        ${COLORS[toast.type ?? 'info']}
      `}
      style={{ animation: 'toastIn 0.28s ease-out' }}
    >
      {ICONS[toast.type ?? 'info']}
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-bold text-sm leading-tight mb-0.5">{toast.title}</p>}
        <p className="text-sm opacity-90 leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="opacity-60 hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts]       = useState([]);
  const [confirm, setConfirm]     = useState(null);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', title = null, duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, title, duration }]);
  }, []);

  // Returns a Promise<boolean> — true = confirmed, false = cancelled
  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirm({
        message,
        title:        options.title        ?? 'Are you sure?',
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel:  options.cancelLabel  ?? 'Cancel',
        danger:       options.danger       ?? false,
        resolve,
      });
    });
  }, []);

  const handleConfirm = (result) => {
    confirm?.resolve(result);
    setConfirm(null);
  };

  return (
    <ToastContext.Provider value={{ addToast, showConfirm }}>
      {children}

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div
            className="bg-white dark:bg-[#29231c] rounded-2xl shadow-2xl max-w-sm w-full p-6"
            style={{ animation: 'toastIn 0.22s ease-out' }}
          >
            <h3 className="text-lg font-black text-[#422919] dark:text-white mb-2">{confirm.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">{confirm.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleConfirm(false)}
                className="px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold text-sm"
              >
                {confirm.cancelLabel}
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className={`px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 ${
                  confirm.danger
                    ? 'bg-red-500'
                    : 'bg-gradient-to-r from-[#c45112] to-[#fbbf24]'
                }`}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  const { addToast, showConfirm } = ctx;
  return {
    success: (msg, title)    => addToast(msg, 'success', title),
    error:   (msg, title)    => addToast(msg, 'error',   title),
    warning: (msg, title)    => addToast(msg, 'warning', title),
    info:    (msg, title)    => addToast(msg, 'info',    title),
    confirm: (msg, options)  => showConfirm(msg, options),
  };
}
