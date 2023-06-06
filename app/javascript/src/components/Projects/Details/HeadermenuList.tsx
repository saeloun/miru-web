import React from "react";

import { PencilIcon, TeamsIcon, DeleteIcon, InvoicesIcon } from "miruIcons";

const HeaderMenuList = ({
  handleGenerateInvoice,
  handleEditProject,
  setIsHeaderMenuVisible,
  handleAddRemoveMembers,
  setShowDeleteDialog,
}) => (
  <>
    <li>
      <button
        className="menuButton__list-item px-0 lg:px-5"
        onMouseDown={handleGenerateInvoice}
      >
        <InvoicesIcon color="#5B34EA" size={16} weight="bold" />
        <span className="ml-3">Generate Invoice</span>
      </button>
    </li>
    <li>
      <button
        className="menuButton__list-item px-0 lg:px-5"
        onMouseDown={e => {
          e?.stopPropagation();
          handleEditProject();
          setIsHeaderMenuVisible(false);
        }}
      >
        <PencilIcon color="#5b34ea" size={16} weight="bold" />
        <span className="ml-3">Edit</span>
      </button>
    </li>
    <li>
      <button
        className="menuButton__list-item px-0 lg:px-5"
        onMouseDown={handleAddRemoveMembers}
      >
        <TeamsIcon color="#5b34ea" size={16} weight="bold" />
        <span className="ml-3">Add/Remove Team Members</span>
      </button>
    </li>
    <li>
      <button
        className="menuButton__list-item px-0 text-miru-red-400 lg:px-5"
        onMouseDown={() => setShowDeleteDialog(true)}
      >
        <DeleteIcon color="#E04646" size={16} weight="bold" />
        <span className="ml-3">Delete Project</span>
      </button>
    </li>
  </>
);

export default HeaderMenuList;
