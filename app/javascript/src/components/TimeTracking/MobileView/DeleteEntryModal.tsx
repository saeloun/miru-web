import React from "react";

const DeleteEntry = ({
  id,
  setShowDeleteDialog,
  handleDeleteEntry,
  setNewEntryView,
  setEditEntryId,
}: IProps) => (
  <div
    className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center p-4"
    style={{
      backgroundColor: "rgba(29, 26, 49, 0.6)",
    }}
  >
    <div className="w-full">
      <div className="transform rounded-lg bg-white p-6 shadow-xl transition-all">
        <div className="flex-col">
          <h6 className="mb-2 text-xl font-bold">Delete Time Entry</h6>
          <p className="mt-4 mb-6 text-base font-normal">
            Are you sure you want to delete this time entry?
          </p>
        </div>
        <div className="flex justify-between">
          <button
            className="button__bg_transparent mr-1 w-1/2 px-10/100 text-center"
            onClick={() => {
              setShowDeleteDialog(false);
            }}
          >
            Cancel
          </button>
          <button
            className="button__bg_purple ml-1 w-1/2 px-10/100 text-center"
            onClick={() => {
              handleDeleteEntry(id);
              setNewEntryView(false);
              setEditEntryId(0);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
);
interface IProps {
  id: any;
  setShowDeleteDialog: any;
  handleDeleteEntry: any;
  setNewEntryView: any;
  setEditEntryId: any;
}

export default DeleteEntry;
