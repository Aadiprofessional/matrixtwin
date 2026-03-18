import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconWrapper } from '../components/ui/IconWrapper';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastInput = {
  title?: string;
  message: string;
  type?: ToastType;
  durationMs?: number;
};

type ConfirmInput =
  | string
  | {
      title?: string;
      message: string;
      confirmLabel?: string;
      cancelLabel?: string;
    };

type PromptInput =
  | string
  | {
      title?: string;
      message: string;
      defaultValue?: string;
      placeholder?: string;
      confirmLabel?: string;
      cancelLabel?: string;
    };

type FeedbackContextValue = {
  showToast: (input: ToastInput | string) => void;
  showConfirm: (input: ConfirmInput) => Promise<boolean>;
  showPrompt: (input: PromptInput, defaultValue?: string) => Promise<string | null>;
};

type ToastItem = {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  durationMs: number;
};

type DialogRequest =
  | {
      kind: 'confirm';
      title: string;
      message: string;
      confirmLabel: string;
      cancelLabel: string;
      resolve: (value: boolean) => void;
    }
  | {
      kind: 'prompt';
      title: string;
      message: string;
      defaultValue: string;
      placeholder: string;
      confirmLabel: string;
      cancelLabel: string;
      resolve: (value: string | null) => void;
    };

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const normalizeToast = (input: ToastInput | string): ToastInput => {
  if (typeof input === 'string') {
    return { message: input, type: 'info', durationMs: 4200 };
  }
  return {
    type: input.type ?? 'info',
    durationMs: input.durationMs ?? 4200,
    title: input.title,
    message: input.message
  };
};

const normalizeConfirm = (input: ConfirmInput) => {
  if (typeof input === 'string') {
    return {
      title: 'Confirm Action',
      message: input,
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel'
    };
  }
  return {
    title: input.title ?? 'Confirm Action',
    message: input.message,
    confirmLabel: input.confirmLabel ?? 'Confirm',
    cancelLabel: input.cancelLabel ?? 'Cancel'
  };
};

const normalizePrompt = (input: PromptInput, defaultValue?: string) => {
  if (typeof input === 'string') {
    return {
      title: 'Input Required',
      message: input,
      defaultValue: defaultValue ?? '',
      placeholder: 'Type here...',
      confirmLabel: 'Submit',
      cancelLabel: 'Cancel'
    };
  }
  return {
    title: input.title ?? 'Input Required',
    message: input.message,
    defaultValue: input.defaultValue ?? defaultValue ?? '',
    placeholder: input.placeholder ?? 'Type here...',
    confirmLabel: input.confirmLabel ?? 'Submit',
    cancelLabel: input.cancelLabel ?? 'Cancel'
  };
};

const toastTheme = {
  success: {
    icon: 'RiCheckLine',
    iconBg: 'bg-emerald-500/20 text-emerald-300',
    border: 'border-emerald-400/30'
  },
  error: {
    icon: 'RiCloseCircleLine',
    iconBg: 'bg-red-500/20 text-red-300',
    border: 'border-red-400/30'
  },
  warning: {
    icon: 'RiErrorWarningLine',
    iconBg: 'bg-amber-500/20 text-amber-200',
    border: 'border-amber-400/35'
  },
  info: {
    icon: 'RiInformationLine',
    iconBg: 'bg-blue-500/20 text-blue-200',
    border: 'border-blue-400/35'
  }
} as const;

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activeDialog, setActiveDialog] = useState<DialogRequest | null>(null);
  const [dialogQueue, setDialogQueue] = useState<DialogRequest[]>([]);
  const [promptValue, setPromptValue] = useState('');
  const alertRef = useRef<((message?: any) => void) | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((input: ToastInput | string) => {
    const normalized = normalizeToast(input);
    const toast: ToastItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: normalized.title,
      message: normalized.message,
      type: normalized.type ?? 'info',
      durationMs: normalized.durationMs ?? 4200
    };
    setToasts((prev) => [...prev.slice(-4), toast]);
    window.setTimeout(() => dismissToast(toast.id), toast.durationMs);
  }, [dismissToast]);

  const enqueueDialog = useCallback((request: DialogRequest) => {
    setDialogQueue((prev) => [...prev, request]);
  }, []);

  const showConfirm = useCallback((input: ConfirmInput) => {
    const options = normalizeConfirm(input);
    return new Promise<boolean>((resolve) => {
      enqueueDialog({
        kind: 'confirm',
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel,
        cancelLabel: options.cancelLabel,
        resolve
      });
    });
  }, [enqueueDialog]);

  const showPrompt = useCallback((input: PromptInput, defaultValue?: string) => {
    const options = normalizePrompt(input, defaultValue);
    return new Promise<string | null>((resolve) => {
      enqueueDialog({
        kind: 'prompt',
        title: options.title,
        message: options.message,
        defaultValue: options.defaultValue,
        placeholder: options.placeholder,
        confirmLabel: options.confirmLabel,
        cancelLabel: options.cancelLabel,
        resolve
      });
    });
  }, [enqueueDialog]);

  useEffect(() => {
    if (activeDialog || dialogQueue.length === 0) {
      return;
    }
    const [nextDialog, ...rest] = dialogQueue;
    setDialogQueue(rest);
    setActiveDialog(nextDialog);
    if (nextDialog.kind === 'prompt') {
      setPromptValue(nextDialog.defaultValue);
    } else {
      setPromptValue('');
    }
  }, [activeDialog, dialogQueue]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    alertRef.current = window.alert.bind(window);
    window.alert = (message?: any) => {
      const text = String(message ?? '');
      if (!text.trim()) return;
      showToast({ message: text, type: 'info' });
    };
    return () => {
      if (alertRef.current) {
        window.alert = alertRef.current;
      }
    };
  }, [showToast]);

  const value = useMemo<FeedbackContextValue>(() => ({
    showToast,
    showConfirm,
    showPrompt
  }), [showToast, showConfirm, showPrompt]);

  const closeConfirm = (result: boolean) => {
    if (activeDialog?.kind !== 'confirm') return;
    activeDialog.resolve(result);
    setActiveDialog(null);
  };

  const closePrompt = (submit: boolean) => {
    if (activeDialog?.kind !== 'prompt') return;
    activeDialog.resolve(submit ? promptValue : null);
    setActiveDialog(null);
    setPromptValue('');
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-3 top-3 z-[120] flex w-[calc(100vw-1.5rem)] max-w-md flex-col gap-2 sm:right-5 sm:top-5">
        <AnimatePresence>
          {toasts.map((toast) => {
            const theme = toastTheme[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                className={`pointer-events-auto rounded-xl border ${theme.border} bg-[#0b0b0bec] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg ${theme.iconBg}`}>
                    <IconWrapper icon={theme.icon} className="text-base" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {toast.title && <p className="text-sm font-semibold text-white">{toast.title}</p>}
                    <p className="text-sm text-gray-200 break-words">{toast.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <IconWrapper icon="RiCloseLine" className="text-lg" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {activeDialog?.kind === 'confirm' && (
        <Dialog
          isOpen
          onClose={() => closeConfirm(false)}
          title={activeDialog.title}
          size="sm"
        >
          <div className="space-y-5">
            <p className="text-sm text-gray-300 leading-relaxed">{activeDialog.message}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => closeConfirm(false)}>
                {activeDialog.cancelLabel}
              </Button>
              <Button variant="ai-gradient" onClick={() => closeConfirm(true)}>
                {activeDialog.confirmLabel}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
      {activeDialog?.kind === 'prompt' && (
        <Dialog
          isOpen
          onClose={() => closePrompt(false)}
          title={activeDialog.title}
          size="sm"
        >
          <div className="space-y-5">
            <p className="text-sm text-gray-300 leading-relaxed">{activeDialog.message}</p>
            <input
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={activeDialog.placeholder}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-portfolio-orange/80 focus:ring-2 focus:ring-portfolio-orange/30"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  closePrompt(true);
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => closePrompt(false)}>
                {activeDialog.cancelLabel}
              </Button>
              <Button variant="ai-gradient" onClick={() => closePrompt(true)}>
                {activeDialog.confirmLabel}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
};
