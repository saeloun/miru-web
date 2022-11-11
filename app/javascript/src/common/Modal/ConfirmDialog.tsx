import React, { FC, ReactNode } from 'react';

import Dialog from './Dialog';

interface IConfirmDialog {
  title: string;
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  yesButtonText?: string;
  noButtonText?: string;
}

const ConfirmDialog: FC<IConfirmDialog> = ({ title, children, open, onClose, onConfirm, yesButtonText, noButtonText }) => {
  if (!open) {
    return <></>;
  }
  return (
    <Dialog title={title} open={open} onClose={onClose}>
      <p className="my-8">
        {children}
      </p>
      <div className="flex justify-between">
        <button
          onClick={onClose}
          className="button__bg_transparent"
        >
          {noButtonText || 'NO'}
        </button>
        <button
          className="button__bg_purple"
          onClick={() => {
            onClose();
            onConfirm();
          }}
        >
          {yesButtonText || 'YES'}
        </button>
      </div>
    </Dialog>
  )
}

export default ConfirmDialog;
