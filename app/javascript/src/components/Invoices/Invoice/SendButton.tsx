import React from "react";

import { PaperPlaneTiltIcon } from "miruIcons";

const SendButton = ({ onClick }) => (
  <div className="flex flex-row justify-items-center send-button-container ml-1">
    <button
      className="flex flex-row justify-center items-center bg-miru-han-purple-1000 rounded h-10 w-32"
      onClick={onClick}
    >
      <div className="flex flex-row justify-between items-center">
        <div className="mr-1">
          <PaperPlaneTiltIcon size={16} color="#FFFFFF" weight="bold" />
        </div>
        <p className="font-bold tracking-widest text-base text-miru-white-1000 ml-1">
          SEND
        </p>
      </div>
    </button>
  </div>
);

export default SendButton;
