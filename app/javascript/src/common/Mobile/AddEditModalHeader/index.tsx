import React from "react";

import { XIcon } from "miruIcons";

const AddEditModalHeader = ({ title, handleOnClose }) => (
  <div className="flex items-center justify-between bg-miru-han-purple-1000 p-3 text-white">
    <span className="w-full pl-6 text-center text-base font-medium leading-5 text-white">
      {title}
    </span>
    <XIcon className="text-white" size={16} onClick={handleOnClose} />
  </div>
);

export default AddEditModalHeader;
