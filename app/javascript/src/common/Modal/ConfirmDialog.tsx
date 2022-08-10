import React, { FC, ReactNode } from 'react';
import Dialog from './Dialog';

interface IConfirmDialog {
  title: string;
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmDialog: FC<IConfirmDialog> = ({ title, children, open, onClose, onConfirm }) => {
  if (!open) {
    return <></>;
  }
  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className="text-xl">{title}</h2>
      <div className="py-5">{children}</div>
      <div className="flex justify-end">
        <div className="flex">
          <button
            className='w-16 h-8 px-6 py-1 mb-1 text-xs font-bold tracking-widest text-white border rounded bg-col-red-400 hover:border-transparent'
            onClick={() => onClose()}
          >
            No
          </button>
        </div>
        <div className="flex">
          <button
            className='w-16 h-8 px-6 py-1 mb-1 text-xs font-bold tracking-widest text-white border rounded bg-miru-han-purple-1000 hover:border-transparent'
            onClick={() => {
              onClose();
              onConfirm();
            }}
          >
            Yes
          </button>
        </div>
      </div>
    </Dialog>
  )
}

export default ConfirmDialog;
