import { ReactNode } from 'react';
import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { AlertCircle } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  variant?: 'danger' | 'primary';
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
  variant = 'danger',
}: ConfirmationDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isConfirming}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isConfirming}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            variant === 'danger'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              : 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
          }`}
        >
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-slate-100">{title}</h4>
          <div className="text-xs text-slate-400 leading-relaxed">{description}</div>
        </div>
      </div>
    </Modal>
  );
}
