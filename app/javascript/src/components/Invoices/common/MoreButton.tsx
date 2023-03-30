import React from "react";

import { DotsThreeVertical } from "phosphor-react";

const MoreButton = ({ onClick }) => (
  <button
    className="ml-2 rounded border border-miru-han-purple-1000 bg-miru-gray-1000 p-2.5 text-miru-han-purple-1000 opacity-50"
    onClick={onClick}
  >
    <DotsThreeVertical size={16} />
  </button>
);

export default MoreButton;
