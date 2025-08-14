import React from "react";

import { Modal, Button } from "StyledComponents";

const DeleteEntry = ({
  id,
  setShowDeleteDialog,
  handleDeleteEntry,
  setNewEntryView,
  setEditEntryId,
  showDeleteDialog,
}: IProps) => {
  const handledelete = () => {
    handleDeleteEntry(id);
    setNewEntryView(false);
    setEditEntryId(0);
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
      isOpen={showDeleteDialog}
      onClose={() => setShowDeleteDialog(false)}
    >
      <div className="flex-col">
        <h6 className="mb-2 text-xl font-bold">Delete Time Entry</h6>
        <p className="mt-4 mb-6 text-base font-normal">
          Are you sure you want to delete this time entry?
        </p>
      </div>
      <div className="flex justify-between">
        <Button
          className="mr-2 w-1/2"
          size="medium"
          style="secondary"
          onClick={() => {
            setShowDeleteDialog(false);
          }}
        >
          CANCEL
        </Button>
        <Button
          className="ml-2 w-1/2"
          size="medium"
          style="primary"
          onClick={handledelete}
        >
          DELETE
        </Button>
      </div>
    </Modal>
  );
};
interface IProps {
  id: any;
  setShowDeleteDialog: any;
  handleDeleteEntry: any;
  setNewEntryView: any;
  setEditEntryId: any;
  showDeleteDialog: boolean;
}

export default DeleteEntry;
