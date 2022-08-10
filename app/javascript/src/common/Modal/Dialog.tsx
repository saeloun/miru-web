import React, { FC, ReactNode } from 'react';
import ExitIcon from './ExitIcon';
import IconButton from './IconButton';

interface IDialog {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}

const Dialog: FC<IDialog> = ({ children, open, onClose }) => {

  if (!open) {
    return <></>;
  }
  return (
    <div className="fixed inset-0 z-50 flex overflow-auto bg-smoke-light">
      <div className="relative flex flex-col w-full max-w-md p-8 m-auto bg-white rounded-lg">
        <div>{children}</div>
        <span className="absolute top-0 right-0 p-4">
          <IconButton onClick={() => onClose()}>
            <ExitIcon />
          </IconButton>
        </span>
      </div>
    </div>
  )
}

export default Dialog;
