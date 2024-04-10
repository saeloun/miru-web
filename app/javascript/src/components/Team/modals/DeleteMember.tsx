import React, { useRef } from "react";

import { useOutsideClick, useKeypress } from "helpers";
import { XIcon } from "miruIcons";
import { Toastr, Modal, Button } from "StyledComponents";

import teamApi from "apis/team";
import { TeamModalType } from "constants/index";
import { useList } from "context/TeamContext";

const DeleteMember = ({ user }) => {
  const wrapperRef = useRef();

  const { setModalState, modal, setTeamList, teamList } = useList();

  const updateTeamListAferDelete = id => {
    const updatedTeamList = teamList.filter(member => member.id !== id);
    setTeamList(updatedTeamList);
  };

  const deleteTeamMember = async () => {
    try {
      if (user.isTeamMember) {
        const res = await teamApi.destroyTeamMember(user.id);
        updateTeamListAferDelete(res.data.user.id);
      } else {
        const res = await teamApi.deleteInvitedMember(user.id);
        updateTeamListAferDelete(res.data.id);
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
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={modal == "delete"}
      onClose={() => {
        setModalState(TeamModalType.NONE);
      }}
    >
      <div className="flex items-center justify-between">
        <h6 className="text-2xl font-bold">
          {user.isTeamMember ? "Delete User" : "Delete Invite"}
        </h6>
        <Button
          style="ternary"
          type="button"
          onClick={() => {
            setModalState(TeamModalType.NONE);
          }}
        >
          <XIcon
            className="text-miru-dark-purple-1000"
            size={16}
            weight="bold"
          />
        </Button>
      </div>
      <p className="mt-4 mb-10">
        Are you sure you want to delete user <b> {user?.name}</b>? <br />
        This action cannot be reversed.
      </p>
      <div className="flex justify-between">
        <Button
          className="mr-2 w-1/2"
          size="medium"
          style="secondary"
          onClick={() => setModalState(TeamModalType.NONE)}
        >
          CANCEL
        </Button>
        <Button
          className="ml-2 w-1/2"
          size="medium"
          style="delete"
          onClick={() => deleteTeamMember()}
        >
          DELETE
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteMember;
