import * as React from "react";

import projectMembersApi from "apis/project-members";
import workspaceAPIS from "apis/workspaces";
import { X } from "phosphor-react";

import EditMembersListForm from "./EditMembersListForm";

export interface IEditMembersList {
  setShowAddMemberDialog: any;
  addedMembers: any;
  projectId: number;
  fetchProjectDetailsAgain: any;
}

const EditMembersList = ({ setShowAddMemberDialog, addedMembers, projectId, fetchProjectDetailsAgain }: IEditMembersList) => {
  const [existingMembers, setExistingMembers] = React.useState(addedMembers);
  const [members, setMembers] = React.useState(addedMembers.map(v => ({ ...v, isExisting: true })));
  const [allMemberList, setAllMemberList] = React.useState([]);

  const markAddedMembers = allMembers => allMembers.map(
    (memberFromAllMembers) => members.some((member) => member.id === memberFromAllMembers.id) ? { ...memberFromAllMembers, isAdded: true } : { ...memberFromAllMembers, isAdded: false });

  const fetchCurrentWorkspaceUsers = async () => {
    try {
      const resp = await workspaceAPIS.users();
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
        fetchProjectDetailsAgain();
      }
      catch (err) {
        // add error handling
      }
    }
  };

  return (
    <div className="px-4 min-h-screen flex items-center justify-center">
      <div
        className="overflow-auto absolute inset-0 z-10 flex items-start justify-center">
        <div className="relative px-4 min-h-screen md:flex md:items-center md:justify-center">
          <div className="rounded-lg px-6 pb-6 bg-white shadow-xl transform transition-all sm:align-middle sm:max-w-md modal-width">
            <div className="flex justify-between items-center mt-6">
              <h6 className="text-base font-extrabold">{addedMembers.length > 0 ? "Add/Remove" : "Add"} Team Member</h6>
              <button type="button"
                onClick={() => {
                  setShowAddMemberDialog(false);
                }}>
                <X size={24} />
              </button>
            </div>
            <EditMembersListForm
              members={members}
              allMemberList={allMemberList}
              updateMemberState={updateMemberState}
              setMembers={setMembers}
              handleSubmit={handleSubmit}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMembersList;
