
import React from "react";

import { TeamModalType } from "constants/index";

import { XIcon } from "miruIcons";

import teamApi from "apis/team";
import Toastr from "common/Toastr";
import { useList } from "context/TeamContext";

const DeleteMember = ({ user }) => {
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
              <h6 className="text-2xl font-bold">{user.isTeamMember ? "Delete User" : "Delete Invite"}</h6>
              <button type="button" onClick={() => { setModalState(TeamModalType.NONE); }}>
                <XIcon size={16} color="#CDD6DF" weight="bold" />
              </button>
            </div>
            <p className="my-8">
              Are you sure you want to delete user <b> {user?.name}</b>? This action cannot be reversed.
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => setModalState(TeamModalType.NONE)}
                className="button__bg_transparent"
              >
                CANCEL
              </button>
              <button
                className="button__bg_purple"
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
