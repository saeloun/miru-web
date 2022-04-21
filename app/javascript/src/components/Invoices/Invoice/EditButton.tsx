import React from "react";
import { Pencil } from "phosphor-react";

const EditButton = ({ onClick }) => (
  <div className="flex flex-col justify-items-center edit-button-container mx-1">
    <button
      className="flex flex-row justify-center border border-miru-han-purple-1000 rounded h-10 w-32"
      onClick={onClick}
    >
      <div className="self-center flex flex-row justify-between items-center">
        <div className="mr-1">
          <Pencil size={16} color="#5B34EA" weight="bold"/>
        </div>
        <p className="font-bold tracking-widest text-base text-miru-han-purple-1000 ml-1">EDIT</p>
      </div>
    </button>
  </div>
);

export default EditButton;
