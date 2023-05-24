import React from "react";

import { DeleteIcon, EditIcon } from "miruIcons";
import { MobileMoreOptions } from "StyledComponents";

const ClientMobileMoreOptions = ({
  clientId,
  setShowMoreOptions,
  handleEditClick,
  handleDeleteClick,
}) => (
  <MobileMoreOptions setVisibilty={setShowMoreOptions}>
    <li
      className="flex items-center px-2 pt-3 text-sm leading-5 text-miru-han-purple-1000"
      onClick={() => {
        handleEditClick(clientId);
        setShowMoreOptions(false);
      }}
    >
      <EditIcon className="mr-4" color="#5B34EA" size={16} />
      Edit
    </li>
    <li
      className="flex items-center px-2 pt-3 text-sm leading-5 text-miru-red-400"
      onClick={() => {
        handleDeleteClick(clientId);
        setShowMoreOptions(false);
      }}
    >
      <DeleteIcon className="mr-4" size={16} />
      Delete
    </li>
  </MobileMoreOptions>
);

export default ClientMobileMoreOptions;
