import * as React from "react";

import companyUsersApi from "apis/company-users";
import projectMembersApi from "apis/project-members";
import Dialog from "common/Modal/Dialog";
import Toastr from "common/Toastr";

import EditMembersListForm from "./EditMembersListForm";

export interface IEditMembersList {
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
  currencySymbol
}: IEditMembersList) => {
  const [existingMembers, setExistingMembers] = React.useState(addedMembers);
  const [members, setMembers] = React.useState(addedMembers.map(v => ({ ...v, isExisting: true })));
  const [allMemberList, setAllMemberList] = React.useState([]);

  const markAddedMembers = allMembers => allMembers.map(
    (memberFromAllMembers) => members.some((member) => member.id === memberFromAllMembers.id) ? { ...memberFromAllMembers, isAdded: true } : { ...memberFromAllMembers, isAdded: false });

  const fetchCurrentWorkspaceUsers = async () => {
    try {
      const resp = await companyUsersApi.get();
      setAllMemberList(markAddedMembers(resp.data.users));
    } catch (error) {
      // Add error handling
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

  const handleSubmit = async e => {
    e.preventDefault();
    const oldIds = existingMembers.map(member => member.id);
    const currentIds = members.map(member => member.id);
    const removedIds = oldIds.filter(id => !currentIds.includes(id));
    const alreadyAddedMembersMap = {};
    existingMembers.forEach((member) => { alreadyAddedMembersMap[member.id] = member.hourlyRate; });
    const newlyAddedMembers = members.filter((member) => !alreadyAddedMembersMap[member.id]);
    const updatedMembers = members.filter((member) => alreadyAddedMembersMap[member.id] && alreadyAddedMembersMap[member.id] != member.hourlyRate);
    if (newlyAddedMembers.length > 0 || updatedMembers.length > 0 || removedIds.length > 0) {
      try {
        await projectMembersApi.update(projectId, {
          members: {
            added_members: newlyAddedMembers,
            removed_member_ids: removedIds,
            updated_members: updatedMembers
          }
        });
        setExistingMembers(members);
        handleAddProjectDetails();
        closeAddRemoveMembers();
        Toastr.success("Changes saved successfully");
      }
      catch (err) {
        // add error handling
      }
    }
  };

  return (
    <Dialog title="Add/Edit Team Members" open={true} onClose={() => { setShowAddMemberDialog(false); }}>
      <EditMembersListForm
        members={members}
        allMemberList={allMemberList}
        updateMemberState={updateMemberState}
        setMembers={setMembers}
        handleSubmit={handleSubmit}
        currencySymbol={currencySymbol}
      />
    </Dialog>
  );
};

export default EditMembersList;
