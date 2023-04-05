import React, { useRef } from "react";

import { useKeypress, useOutsideClick } from "helpers";
import Logger from "js-logger";
import { XIcon } from "miruIcons";

import companyUsersApi from "apis/company-users";
import projectMembersApi from "apis/project-members";
import Toastr from "common/Toastr";

import EditMembersListForm from "./EditMembersListForm";

interface IEditMembersList {
  setShowAddMemberDialog: any;
  addedMembers: any;
  projectId: number;
  handleAddProjectDetails: any;
  closeAddRemoveMembers: any;
  currencySymbol: string;
}

const EditMembersList = ({
  setShowAddMemberDialog,
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
    setShowAddMemberDialog(false);
  });

  const handleEscapeKey = () => {
    setShowAddMemberDialog(false);
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
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-10 flex items-start justify-center overflow-auto"
      style={{
        backgroundColor: "rgba(29, 26, 49, 0.6)",
      }}
    >
      <div className="relative h-full w-full px-4 md:flex md:items-center md:justify-center">
        <div
          className="min-w-1/2 relative top-1/3 mx-auto transform rounded-lg bg-white py-6 pl-6 shadow-xl transition-all sm:max-w-md sm:align-middle md:top-0 md:min-w-400"
          ref={wrapperRef}
        >
          <div className=" mr-6 flex items-center justify-between">
            <h6 className="text-base font-extrabold capitalize">
              Add Team Members
            </h6>
            <button
              className="menuButton__button"
              type="button"
              onClick={() => {
                setShowAddMemberDialog(false);
              }}
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
        </div>
      </div>
    </div>
  );
};

export default EditMembersList;
