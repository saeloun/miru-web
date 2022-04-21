import React from "react";
import {
  ArrowLeft
} from "phosphor-react";

const BackButton = ({ href }) => (
  <div className="h-14 w-14 flex flex-row justify-center items-center mr-1">
    <a href={href}>
      <ArrowLeft size={20} />
    </a>
  </div>
);

export default BackButton;
