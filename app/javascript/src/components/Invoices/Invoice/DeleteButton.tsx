import React from "react";

import { DeleteIcon } from "miruIcons";

const DeleteButton = ({ onClick }) => (
  <div className="delete-button-container mr-1 flex flex-row justify-items-center">
    <button
      className="flex h-10 w-32 flex-row items-center justify-center rounded border border-destructive"
      onClick={onClick}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="mr-1">
          <DeleteIcon color="#E04646" size={16} weight="bold" />
        </div>
        <p className="ml-1 text-base font-bold tracking-widest text-destructive">
          DELETE
        </p>
      </div>
    </button>
  </div>
);

export default DeleteButton;
