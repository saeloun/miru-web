import React from "react";
import {
  ArrowLeft
} from "phosphor-react";

const BackButton = ({ onClick }) => (
  <div className="h-14 w-14 flex justify-around mr-1">
    <button onClick={onClick}>
      <ArrowLeft size={20} />
    </button>
  </div>
);

export default BackButton;
