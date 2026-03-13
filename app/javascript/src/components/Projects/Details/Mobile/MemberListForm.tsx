import React, { useState, useEffect } from "react";

import { companyUsersApi, projectMembersApi } from "apis/api";
import { toast } from "sonner";
import { X } from "phosphor-react";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";

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
      toast.success("Team members updated");
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
    <Dialog open onOpenChange={open => !open && closeAddRemoveMembers()}>
      <DialogContent className="flex h-full max-h-[100dvh] w-full max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:max-w-lg sm:rounded-2xl sm:border sm:p-0">
        <DialogHeader className="border-b border-border px-4 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>Manage project members</DialogTitle>
              <DialogDescription>
                Add teammates, update rates, or remove members from this
                project.
              </DialogDescription>
            </div>
            <Button
              size="icon"
              type="button"
              variant="ghost"
              onClick={closeAddRemoveMembers}
            >
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
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
      </DialogContent>
    </Dialog>
  );
};
export default MembersListForm;
