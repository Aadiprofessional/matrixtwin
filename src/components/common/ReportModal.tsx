import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as RiIcons from 'react-icons/ri';
import { Button } from '../ui/Button';

interface ReportModalTheme {
  containerBorder: string;
  containerBg: string;
  headerGradient: string;
  subtitleText: string;
  bodyBackground: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onDownload?: () => void;
  isDownloading?: boolean;
  downloadLabel?: string;
  downloadingLabel?: string;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  theme?: Partial<ReportModalTheme>;
  maxWidthClassName?: string;
}

const defaultTheme: ReportModalTheme = {
  containerBorder: 'border-[#cbdcab]/70 dark:border-dark-700',
  containerBg: 'bg-white dark:bg-dark-900',
  headerGradient: 'from-[#1f2710] to-[#526728]',
  subtitleText: 'text-[#dbe5c4]',
  bodyBackground: 'bg-[#f2f6e9]/45 dark:bg-dark-800/20'
};

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  onDownload,
  isDownloading = false,
  downloadLabel = 'Download PDF',
  downloadingLabel = 'Preparing PDF...',
  contentRef,
  children,
  theme,
  maxWidthClassName = 'max-w-[96vw]'
}) => {
  const mergedTheme = { ...defaultTheme, ...theme };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70]">
          <motion.div
            className="absolute inset-0 bg-[#1f2710]/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-3">
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className={`flex h-[98dvh] w-full flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:h-[95dvh] sm:w-[98vw] sm:rounded-2xl ${maxWidthClassName} ${mergedTheme.containerBorder} ${mergedTheme.containerBg}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex flex-col gap-3 border-b border-white/10 bg-gradient-to-r px-4 py-4 text-white md:flex-row md:items-center md:justify-between md:px-6 ${mergedTheme.headerGradient}`}>
                <div>
                  <h2 className="text-xl font-display font-semibold md:text-2xl">{title}</h2>
                  {subtitle && (
                    <p className={`mt-1 text-xs md:text-sm ${mergedTheme.subtitleText}`}>
                      {subtitle}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {onDownload && (
                    <Button
                      variant="outline"
                      leftIcon={isDownloading ? <RiIcons.RiLoader4Line className="animate-spin" /> : <RiIcons.RiDownload2Line />}
                      onClick={onDownload}
                      disabled={isDownloading}
                    >
                      {isDownloading ? downloadingLabel : downloadLabel}
                    </Button>
                  )}
                  <Button variant="ghost" leftIcon={<RiIcons.RiCloseLine />} onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>

              <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 ${mergedTheme.bodyBackground}`}>
                <div ref={contentRef} className="space-y-6">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
