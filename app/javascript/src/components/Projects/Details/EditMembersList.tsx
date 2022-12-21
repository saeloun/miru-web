import React from "react";

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

  const updateMemberState = (idx, key, val) => {
    const modalMembers = [...members];
    const memberToEdit = { ...members[idx] };
    memberToEdit[key] = val;
    modalMembers[idx] = memberToEdit;
    setMembers(modalMembers);
  };

  const mappedMembers = (member, alreadyAddedMembersMap) => ({
    ...member,
    id: alreadyAddedMembersMap[member.id]?.project_member_id,
    user_id: member.id,
    hourly_rate: member.hourlyRate,
  });

  const handleSubmit = async e => {
    e.preventDefault();
    const currentIds = members.map(member => member.id);
    const removedMembers = existingMembers.filter(
      member => !currentIds.includes(member.id)
    );
    const alreadyAddedMembersMap = {};
    existingMembers.forEach(member => {
      alreadyAddedMembersMap[member.id] = {
        hourly_rate: member.hourlyRate,
        project_member_id: member.project_member_id,
      };
    });

    const newAndUpdatedMembers = members.reduce((acc, member) => {
      if (
        !alreadyAddedMembersMap[member.id] ||
        alreadyAddedMembersMap[member.id].hourly_rate != member.hourlyRate
      ) {
        acc = [...acc, mappedMembers(member, alreadyAddedMembersMap)];
      }

      return acc;
    }, []);
    if (newAndUpdatedMembers.length > 0 || removedMembers.length > 0) {
      try {
        const payload = {
          project: {
            project_members_attributes: [
              ...newAndUpdatedMembers,
              ...removedMembers.map(member => ({
                id: member.project_member_id,
                _destroy: true,
              })),
            ],
          },
        };

        await projectMembersApi.update(projectId, payload);
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
        <div className="modal-width transform rounded-lg bg-white px-6 pb-6 shadow-xl transition-all sm:max-w-md sm:align-middle">
          <div className="mt-6 flex items-center justify-between">
            <h6 className="text-base font-extrabold">Add/Edit Team Members</h6>
            <button
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
            setMembers={setMembers}
            updateMemberState={updateMemberState}
          />
        </div>
      </div>
    </div>
  );
};

export default EditMembersList;
