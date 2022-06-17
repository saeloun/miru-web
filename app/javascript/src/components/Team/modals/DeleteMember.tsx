
import React from "react";
import { useList } from "context/TeamContext";
import { X } from "phosphor-react";

const DeleteMember = () => {
  const { setModalState } = useList();
  return (
    <div className="px-4 flex items-center justify-center">
      <div
        className="overflow-auto fixed top-0 left-0 right-0 bottom-0 inset-0 z-10 flex items-start justify-center"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)"
        }}
      >
        <div className="relative px-4 h-full w-full md:flex md:items-center md:justify-center">
          <div className="rounded-lg px-6 pb-6 bg-white shadow-xl transform transition-all sm:align-middle sm:max-w-md modal-width">
            <div className="flex justify-between items-center mt-6">
              <h6 className="text-2xl font-bold">Delete User</h6>
              <button type="button" onClick={() => { setModalState(""); }}>
                <X size={16} color="#CDD6DF" weight="bold" />
              </button>
            </div>
            <p className="my-8">
              Are you sure you want to delete user John Smith? This action cannot be reversed.
            </p>
            <div className="flex justify-between">
              <button
                className="button__bg_transparent"
              >
                CANCEL
              </button>
              <button
                className="button__bg_purple"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteMember;
