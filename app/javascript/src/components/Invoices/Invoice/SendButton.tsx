import React from "react";

import { PaperPlaneTiltIcon } from "miruIcons";

const SendButton = ({ onClick }) => (
  <div className="send-button-container ml-1 flex flex-row justify-items-center">
    <button
      className="flex h-10 w-32 flex-row items-center justify-center rounded bg-miru-han-purple-1000"
      onClick={onClick}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="mr-1">
          <PaperPlaneTiltIcon color="#FFFFFF" size={16} weight="bold" />
        </div>
        <p className="ml-1 text-base font-bold tracking-widest text-miru-white-1000">
          SEND
        </p>
      </div>
    </button>
  </div>
);

export default SendButton;
