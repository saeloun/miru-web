import React from "react";

import { DotsThreeVerticalIcon } from "miruIcons";

const MoreButton = ({ onClick }) => (
  <button
    className="ml-2 rounded border border-miru-han-purple-1000 bg-miru-gray-1000 p-2.5 text-miru-han-purple-1000 opacity-50"
    id="menuOpen"
    onClick={onClick}
  >
    <DotsThreeVerticalIcon size={16} />
  </button>
);

export default MoreButton;
