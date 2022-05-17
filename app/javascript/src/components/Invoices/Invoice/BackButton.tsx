import React from "react";
import { Link } from "react-router-dom";

import {
  ArrowLeft
} from "phosphor-react";

const BackButton = ({ href }) => (
  <div className="h-14 w-14 flex flex-row justify-center items-center mr-1">
    <Link to={href}>
      <ArrowLeft size={20} />
    </Link>
  </div>
);

export default BackButton;
