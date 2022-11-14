import React from "react";

import { TeamModalType } from "constants/index";

import teamApi from "apis/team";
import ConfirmDialog from "common/Modal/ConfirmDialog";
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
    <ConfirmDialog
      title={user.isTeamMember ? "Archive User" : "Delete Invite"}
      open={true}
      onClose={() => { setModalState(TeamModalType.NONE); }}
      onConfirm={deleteTeamMember}
      yesButtonText="DELETE"
      noButtonText="CANCEL"
    >
      Are you sure you want to archive user <b> {user?.name}</b>? This action cannot be reversed.
    </ConfirmDialog>
  );
};

export default DeleteMember;
