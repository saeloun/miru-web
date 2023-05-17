import React, { useRef } from "react";

import { useOutsideClick, useKeypress } from "helpers";
import { XIcon } from "miruIcons";
import { Toastr } from "StyledComponents";

import teamApi from "apis/team";
import { TeamModalType } from "constants/index";
import { useList } from "context/TeamContext";

const DeleteMember = ({ user }) => {
  const wrapperRef = useRef();

  const { setModalState } = useList();

  const deleteTeamMember = async () => {
    try {
      if (user.isTeamMember) {
        await teamApi.destroyTeamMember(user.id);
      } else {
        await teamApi.deleteInvitedMember(user.id);
      }
      setModalState(TeamModalType.NONE);
    } catch (error) {
      Toastr.error(error.message);
    }
  };

  useOutsideClick(wrapperRef, () => {
    setModalState(TeamModalType.NONE);
  });

  useKeypress("Escape", () => {
    setModalState(TeamModalType.NONE);
  });

  return (
    <div className="flex items-center justify-center px-4">
      <div
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center overflow-auto"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)",
        }}
      >
        <div className="relative flex h-full w-full items-center justify-center px-4">
          <div
            className="modal-width transform rounded-lg bg-white px-6 pb-6 shadow-xl transition-all sm:max-w-md sm:align-middle"
            ref={wrapperRef}
          >
            <div className="mt-6 flex items-center justify-between">
              <h6 className="text-2xl font-bold">
                {user.isTeamMember ? "Delete User" : "Delete Invite"}
              </h6>
              <button
                type="button"
                onClick={() => {
                  setModalState(TeamModalType.NONE);
                }}
              >
                <XIcon color="#CDD6DF" size={16} weight="bold" />
              </button>
            </div>
            <p className="my-8">
              Are you sure you want to delete user <b> {user?.name}</b>? This
              action cannot be reversed.
            </p>
            <div className="flex justify-between">
              <button
                className="button__bg_transparent mr-2"
                onClick={() => setModalState(TeamModalType.NONE)}
              >
                CANCEL
              </button>
              <button
                className="button__bg_purple ml-2"
                onClick={() => deleteTeamMember()}
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
