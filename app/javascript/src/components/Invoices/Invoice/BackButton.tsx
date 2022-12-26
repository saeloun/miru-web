import React from "react";

import { ArrowLeftIcon } from "miruIcons";
import { Link } from "react-router-dom";

const BackButton = ({ href }) => (
  <div className="mr-1 flex h-14 w-14 flex-row items-center justify-center">
    <Link to={href}>
      <ArrowLeftIcon size={20} />
    </Link>
  </div>
);

export default BackButton;
