import React, { useState, useEffect } from "react";

import { XIcon } from "miruIcons";
import { Button, Toastr } from "StyledComponents";

import { companyUsersApi, projectMembersApi } from "apis/api";

import EditMembersListForm from "../EditMembersListForm";

const MembersListForm = ({
  addedMembers,
  closeAddRemoveMembers,
  currencySymbol,
  handleAddProjectDetails,
  projectId,
}) => {
  const [members, setMembers] = React.useState(
    addedMembers.map(v => ({ ...v, isExisting: true }))
  );
  const [allMemberList, setAllMemberList] = useState<any[]>([]);
  const [existingMembers, setExistingMembers] = React.useState(addedMembers);

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
    }
  };

  const markAddedMembers = allMembers =>
    allMembers.map(memberFromAllMembers =>
      members.some(member => member.id === memberFromAllMembers.id)
        ? { ...memberFromAllMembers, isAdded: true }
        : { ...memberFromAllMembers, isAdded: false }
    );

  const fetchCurrentWorkspaceUsers = async () => {
    const resp = await companyUsersApi.get();
    setAllMemberList(markAddedMembers(resp.data.users));
  };

  useEffect(() => {
    setAllMemberList(markAddedMembers(allMemberList));
  }, [members]);

  useEffect(() => {
    fetchCurrentWorkspaceUsers();
  }, []);

  const updateMemberState = (memberIndex, key, val) => {
    const modalMembers = [...members];
    const memberToEdit = { ...members[memberIndex] };
    memberToEdit[key] = val;
    modalMembers[memberIndex] = memberToEdit;
    setMembers(modalMembers);
  };

  return (
    <div className="flex w-full flex-col">
      <div className="flex h-12 w-full items-center bg-miru-han-purple-1000 text-white shadow-c1">
        <span className="flex w-full items-center justify-center py-3 pl-8">
          Add Team Members
        </span>
        <Button className="p-3" onClick={closeAddRemoveMembers}>
          <XIcon className="text-white" size={16} weight="bold" />
        </Button>
      </div>
      <div className="flex flex-1 flex-col p-4">
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
  );
};
export default MembersListForm;
