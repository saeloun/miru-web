import React, { useRef } from "react";

import { useUserContext } from "context/UserContext";
import { useOutsideClick } from "helpers";
import { PencilSimple, Trash, Receipt, UsersThree } from "phosphor-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "components/ui/dropdown-menu";

const HeaderMenuList = ({
  handleGenerateInvoice,
  handleEditProject,
  setIsHeaderMenuVisible,
  handleAddRemoveMembers,
  setShowDeleteDialog,
}) => {
  const menuRef = useRef<HTMLUListElement>(null);
  const { isDesktop } = useUserContext();

  useOutsideClick(menuRef, () => setIsHeaderMenuVisible(false));

  return (
    <div ref={menuRef}>
      {!isDesktop && (
        <>
          <DropdownMenuItem onClick={handleGenerateInvoice}>
            <Receipt size={16} />
            <span>New invoice</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddRemoveMembers}>
            <UsersThree size={16} />
            <span>Manage team</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuItem
        onClick={e => {
          e?.stopPropagation();
          handleEditProject();
          setIsHeaderMenuVisible(false);
        }}
      >
        <PencilSimple size={16} />
        <span>Edit project</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onClick={() => setShowDeleteDialog(true)}
      >
        <Trash size={16} />
        <span>Delete project</span>
      </DropdownMenuItem>
    </div>
  );
};

export default HeaderMenuList;
