import React from "react";

import { Trash } from "phosphor-react";

const DeleteButton = ({ onClick }) => (
  <div className="flex flex-row justify-items-center delete-button-container mr-1">
    <button
      className="flex flex-row justify-center items-center border border-col-red-400 rounded h-10 w-32"
      onClick={onClick}
    >
      <div className="flex flex-row justify-between items-center">
        <div className="mr-1">
          <Trash size={16} color="#E04646" weight="bold"/>
        </div>
        <p className="font-bold tracking-widest text-base text-col-red-400 ml-1">DELETE</p>
      </div>
    </button>
  </div>
);

export default DeleteButton;
