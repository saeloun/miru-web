import React, { useRef } from "react";

import { companyUsersApi, projectMembersApi } from "apis/api";
import { useKeypress, useOutsideClick } from "helpers";
import Logger from "js-logger";
import { XIcon } from "miruIcons";
import { Toastr, Modal } from "StyledComponents";

import EditMembersListForm from "./EditMembersListForm";

interface IEditMembersList {
  addedMembers: any;
  projectId: number;
  handleAddProjectDetails: any;
  closeAddRemoveMembers: any;
  currencySymbol: string;
}

const EditMembersList = ({
  addedMembers,
  projectId,
  handleAddProjectDetails,
  closeAddRemoveMembers,
  currencySymbol,
}: IEditMembersList) => {
  const [existingMembers, setExistingMembers] = React.useState(addedMembers);
  const [members, setMembers] = React.useState(
    addedMembers.map(v => ({ ...v, isExisting: true }))
  );
  const [allMemberList, setAllMemberList] = React.useState([]);
  const wrapperRef = useRef(null);

  const markAddedMembers = allMembers =>
    allMembers.map(memberFromAllMembers =>
      members.some(member => member.id === memberFromAllMembers.id)
        ? { ...memberFromAllMembers, isAdded: true }
        : { ...memberFromAllMembers, isAdded: false }
    );

  const fetchCurrentWorkspaceUsers = async () => {
    try {
      const resp = await companyUsersApi.get();
      setAllMemberList(markAddedMembers(resp.data.users));
    } catch (error) {
      Logger.error(error);
    }
  };

  React.useEffect(() => {
    fetchCurrentWorkspaceUsers();
  }, []);

  React.useEffect(() => {
    setAllMemberList(markAddedMembers(allMemberList));
  }, [members]);

  const updateMemberState = (memberIndex, key, val) => {
    const modalMembers = [...members];
    const memberToEdit = { ...members[memberIndex] };
    memberToEdit[key] = val;
    modalMembers[memberIndex] = memberToEdit;
    setMembers(modalMembers);
  };

  useOutsideClick(wrapperRef, () => {
    closeAddRemoveMembers();
  });

  const handleEscapeKey = () => {
    closeAddRemoveMembers();
  };

  useKeypress("Escape", handleEscapeKey);

  const handleSubmit = async e => {
    e.preventDefault();
    const oldIds = existingMembers.map(member => member.id);
    const currentIds = members.map(member => member.id);
    const removedIds = oldIds.filter(id => !currentIds.includes(id));
    const alreadyAddedMembersMap = {};
    existingMembers.forEach(member => {
      alreadyAddedMembersMap[member.id] = member.hourlyRate;
    });

    const newlyAddedMembers = members.filter(member => {
      if (!alreadyAddedMembersMap[member.id]) {
        member.hourly_rate = member.hourlyRate;
        delete member.hourlyRate;

        return member;
      }
    });

    const updatedMembers = members.filter(member => {
      if (
        alreadyAddedMembersMap[member.id] &&
        alreadyAddedMembersMap[member.id] != member.hourlyRate
      ) {
        member.hourly_rate = member.hourlyRate;
        delete member.hourlyRate;

        return member;
      }
    });

    if (
      newlyAddedMembers.length > 0 ||
      updatedMembers.length > 0 ||
      removedIds.length > 0
    ) {
      try {
        await projectMembersApi.update(projectId, {
          members: {
            added_members: newlyAddedMembers,
            updated_members: updatedMembers,
            removed_member_ids: removedIds,
          },
        });
        setExistingMembers(members);
        handleAddProjectDetails();
        closeAddRemoveMembers();
        Toastr.success("Changes saved successfully");
      } catch (err) {
        Logger.error(err);
      }
    }
  };

  return (
    <Modal
      isOpen
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
      onClose={closeAddRemoveMembers}
    >
      <div className="flex items-center justify-between">
        <h6 className="text-base font-extrabold capitalize">
          Add Team Members
        </h6>
        <button
          className="menuButton__button"
          type="button"
          onClick={closeAddRemoveMembers}
        >
          <XIcon color="#CDD6DF" size={16} weight="bold" />
        </button>
      </div>
      <EditMembersListForm
        allMemberList={allMemberList}
        currencySymbol={currencySymbol}
        handleSubmit={handleSubmit}
        members={members}
        setAllMemberList={setAllMemberList}
        setMembers={setMembers}
        updateMemberState={updateMemberState}
      />
    </Modal>
  );
};

export default EditMembersList;
