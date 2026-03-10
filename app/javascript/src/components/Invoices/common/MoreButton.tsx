import React from "react";

import { DotsThreeVerticalIcon } from "miruIcons";

const MoreButton = ({ onClick }) => (
  <button
    className="ml-2 rounded border border-primary bg-secondary p-2.5 text-primary opacity-50"
    id="menuOpen"
    onClick={onClick}
  >
    <DotsThreeVerticalIcon size={16} />
  </button>
);

export default MoreButton;
