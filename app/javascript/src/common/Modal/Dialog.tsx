import React, { FC, ReactNode } from 'react';

import { X } from "phosphor-react";

interface IDialog {
  title: string;
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}

const Dialog: FC<IDialog> = ({ title, children, open, onClose }) => {

  if (!open) {
    return <></>;
  }
  return (
    <div className="px-4 flex items-center justify-center">
      <div
        className="overflow-auto fixed top-0 left-0 right-0 bottom-0 inset-0 z-10 flex items-start justify-center"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)"
        }}
      >
        <div className="relative px-4 h-full w-full md:flex md:items-center md:justify-center">
          <div className="rounded-lg px-6 pb-6 bg-white shadow-xl transform transition-all sm:align-middle sm:max-w-md modal-width">
            <div className="flex justify-between items-center mt-6">
              <h6 className="text-2xl font-bold">{title}</h6>
              <button type="button" onClick={onClose}>
                <X size={16} weight="bold" className="text-col-han-app-1000" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dialog;
