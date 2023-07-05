import React, { useRef } from "react";

import { useOutsideClick } from "helpers";
import { PencilIcon, DeleteIcon } from "miruIcons";

const HeaderMenuList = ({
  // eslint-disable-next-line no-unused-vars
  handleGenerateInvoice,
  handleEditProject,
  setIsHeaderMenuVisible,
  // eslint-disable-next-line no-unused-vars
  handleAddRemoveMembers,
  setShowDeleteDialog,
}) => {
  const menuRef = useRef();
  useOutsideClick(menuRef, () => setIsHeaderMenuVisible(false));

  return (
    <ul ref={menuRef}>
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
          className="menuButton__list-item px-0 text-miru-red-400 lg:px-5"
          onMouseDown={() => setShowDeleteDialog(true)}
        >
          <DeleteIcon color="#E04646" size={16} weight="bold" />
          <span className="ml-3">Delete Project</span>
        </button>
      </li>
    </ul>
  );
};

export default HeaderMenuList;
