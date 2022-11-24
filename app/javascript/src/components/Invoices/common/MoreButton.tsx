import React from "react";

import { DotsThreeVertical } from "phosphor-react";

const MoreButton = ({ onClick }) => (
  <button
    onClick={onClick}
    data-cy="more-options-view"
    className="p-2.5 ml-2 bg-miru-gray-1000 border border-miru-han-purple-1000 text-miru-han-purple-1000 rounded opacity-50"
  >
    <DotsThreeVertical size={16}/>
  </button>
);

export default MoreButton;
