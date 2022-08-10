import React, { FC, ReactNode } from 'react';
interface IIconButton {
  children: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}
const IconButton: FC<IIconButton> = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`focus:outline-none focus:border-none hover:bg-gray-400 hover:bg-opacity-25 p-2 rounded-full inline-flex items-center ${className}`}
  >
    {children}
  </button>
)

export default IconButton;
