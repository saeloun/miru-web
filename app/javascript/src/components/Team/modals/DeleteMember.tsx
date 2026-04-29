import { TeamModalType } from "constants/index";

import React, { useRef } from "react";

import { teamApi } from "apis/api";
import { useList } from "context/TeamContext";
import { useOutsideClick, useKeypress } from "helpers";
import { i18n } from "../../../i18n";
import { XIcon } from "miruIcons";
import { Toastr, Modal, Button } from "StyledComponents";

const DeleteMember = ({ user }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

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
          {user.isTeamMember
            ? i18n.t("team.deleteUser")
            : i18n.t("team.deleteInvite")}
        </h6>
        <Button
          style="ternary"
          type="button"
          onClick={() => {
            setModalState(TeamModalType.NONE);
          }}
        >
          <XIcon className="text-foreground" size={16} weight="bold" />
        </Button>
      </div>
      <p className="mt-4 mb-10">
        {i18n.t("team.deleteUserConfirm", { name: user?.name })}
      </p>
      <div className="flex justify-between">
        <Button
          className="mr-2 w-1/2"
          size="medium"
          style="secondary"
          onClick={() => setModalState(TeamModalType.NONE)}
        >
          {i18n.t("cancel")}
        </Button>
        <Button
          className="ml-2 w-1/2"
          size="medium"
          style="delete"
          onClick={() => deleteTeamMember()}
        >
          {i18n.t("delete")}
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteMember;
