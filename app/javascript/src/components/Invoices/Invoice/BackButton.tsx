import React from "react";
import {
  ArrowLeft
} from "phosphor-react";

const BackButton = () => (
  <div className="h-14 w-14 flex justify-around mr-1">
    <button>
      <ArrowLeft size={20} />
    </button>
  </div>
);

export default BackButton;
