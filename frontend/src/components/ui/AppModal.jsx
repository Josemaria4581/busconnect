/**
 * AppModal — Modal de confirmación y alertas global.
 *
 * Props:
 *   isOpen    {boolean}   - Si el modal está visible
 *   type      {string}    - 'danger' | 'success' | 'warning' | 'info'
 *   title     {string}    - Título del modal
 *   message   {string}    - Mensaje descriptivo
 *   onConfirm {function}  - Callback al pulsar el botón principal
 *   onCancel  {function}  - Callback al cerrar/cancelar (también cierra pulsando fuera)
 *   confirmText {string}  - Texto del botón de confirmación (default: 'Confirmar')
 *   cancelText  {string}  - Texto del botón de cancelar (default: 'Cancelar')
 *
 * Also exposes:
 *   <AppToast> — small bottom toast for non-blocking messages
 */

import { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const ICONS = {
    danger:  { icon: XCircle,       ring: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-600 dark:text-red-400'    },
    success: { icon: CheckCircle,   ring: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-600 dark:text-green-400' },
    warning: { icon: AlertTriangle, ring: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-600 dark:text-amber-400' },
    info:    { icon: Info,          ring: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-600 dark:text-blue-400'  },
};

const CONFIRM_CLASSES = {
    danger:  'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    info:    'bg-primary hover:bg-primary/90 text-white',
};

export default function AppModal({
    isOpen,
    type = 'info',
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    children,          // optional extra content (e.g. input)
    showCancel = true,
}) {
    // Cierra con ESC
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const { icon: Icon, ring, text } = ICONS[type] ?? ICONS.info;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
        >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
                {/* Icon + close */}
                <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${ring}`}>
                        <Icon className={`w-7 h-7 ${text}`} />
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div>
                    {title && (
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h2>
                    )}
                    {message && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
                    )}
                    {children}
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-1">
                    {showCancel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    {onConfirm && (
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${CONFIRM_CLASSES[type] ?? CONFIRM_CLASSES.info}`}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}


/** Lightweight toast for non-blocking messages */
export function AppToast({ isOpen, type = 'info', message, onClose }) {
    useEffect(() => {
        if (!isOpen) return;
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [isOpen, message, onClose]);

    if (!isOpen) return null;

    const colors = {
        success: 'bg-green-600',
        danger:  'bg-red-600',
        warning: 'bg-amber-500',
        info:    'bg-blue-600',
    };

    return (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-xl flex items-center gap-3 ${colors[type] ?? colors.info}`}>
            {message}
            <button onClick={onClose} className="opacity-70 hover:opacity-100"><X size={14} /></button>
        </div>
    );
}
