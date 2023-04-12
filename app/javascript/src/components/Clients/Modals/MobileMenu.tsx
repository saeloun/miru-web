import React from "react";

import { DeleteIcon, EditIcon, PlusIcon } from "miruIcons";

interface IProps {
  setShowDeleteDialog: any;
  setShowMobileModal: any;
}

const MobileMenu = ({ setShowDeleteDialog, setShowMobileModal }: IProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{
      backgroundColor: "rgba(29, 26, 49, 0.6)",
    }}
    onMouseDown={() => setShowMobileModal(false)}
  >
    <div className="relative flex h-full w-full flex-col items-center justify-center p-8 px-4 md:flex md:items-center md:justify-center">
      <div className="modal-width w-full min-w-0 transform rounded-lg bg-white px-6 pb-6 shadow-xl transition-all sm:max-w-md sm:align-middle">
        <div className="flex items-center pt-6 text-miru-han-purple-1000">
          <PlusIcon />
          <span className="ml-3">Add new project</span>
        </div>
        <br />
        <div className="flex items-center text-miru-han-purple-1000">
          <EditIcon />
          <span className="ml-3">Edit</span>
        </div>
        <br />
        <div
          className="flex items-center text-miru-red-400"
          onClick={() => {
            setShowMobileModal(false);
            setShowDeleteDialog(true);
          }}
        >
          <DeleteIcon />
          <span className="ml-3">Delete</span>
        </div>
      </div>
    </div>
  </div>
);

export default MobileMenu;
