import React from "react";

import { DeleteIcon, EditIcon } from "miruIcons";
import { MobileMoreOptions } from "StyledComponents";
import { i18n } from "../../i18n";

const ClientMobileMoreOptions = ({
  clientId,
  setShowMoreOptions,
  handleEditClick,
  handleDeleteClick,
  showMoreOptions,
}) => (
  <MobileMoreOptions
    setVisibilty={setShowMoreOptions}
    visibilty={showMoreOptions}
  >
    <li
      className="flex items-center px-2 pt-3 text-sm leading-5 text-primary"
      onClick={() => {
        handleEditClick(clientId);
        setShowMoreOptions(false);
      }}
    >
      <EditIcon className="mr-4" color="#5E58F1" size={16} />
      {i18n.t("edit")}
    </li>
    <li
      className="flex items-center px-2 pt-3 text-sm leading-5 text-destructive"
      onClick={() => {
        handleDeleteClick(clientId);
        setShowMoreOptions(false);
      }}
    >
      <DeleteIcon className="mr-4" size={16} />
      {i18n.t("delete")}
    </li>
  </MobileMoreOptions>
);

export default ClientMobileMoreOptions;
