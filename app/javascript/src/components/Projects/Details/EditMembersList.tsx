import React from "react";

import { companyUsersApi, projectMembersApi } from "apis/api";
import Logger from "js-logger";
import { toast } from "sonner";
import { i18n } from "../../../i18n";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";

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

  const fetchCurrentWorkspaceUsers = async () => {
    try {
      const resp = await companyUsersApi.get();
      setAllMemberList(resp.data.users || []);
    } catch (error) {
      Logger.error(error);
    }
  };

  React.useEffect(() => {
    fetchCurrentWorkspaceUsers();
  }, []);

  const updateMemberState = (memberIndex, key, val) => {
    const nextMembers = [...members];
    nextMembers[memberIndex] = { ...nextMembers[memberIndex], [key]: val };
    setMembers(nextMembers);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const oldIds = existingMembers.map(member => member.id);
    const currentIds = members.map(member => member.id).filter(Boolean);
    const removedIds = oldIds.filter(id => !currentIds.includes(id));
    const existingRateMap = {};

    existingMembers.forEach(member => {
      existingRateMap[member.id] = member.hourlyRate;
    });

    const newlyAddedMembers = members
      .filter(member => member.id && !existingRateMap[member.id])
      .map(member => ({
        id: member.id,
        hourly_rate: member.hourlyRate,
      }));

    const updatedMembers = members
      .filter(
        member =>
          member.id &&
          existingRateMap[member.id] &&
          existingRateMap[member.id] != member.hourlyRate
      )
      .map(member => ({
        id: member.id,
        hourly_rate: member.hourlyRate,
      }));

    if (
      newlyAddedMembers.length === 0 &&
      updatedMembers.length === 0 &&
      removedIds.length === 0
    ) {
      closeAddRemoveMembers();

      return;
    }

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
      toast.success(i18n.t("projects.teamMembersUpdated"));
    } catch (error) {
      Logger.error(error);
    }
  };

  return (
    <Dialog open onOpenChange={open => !open && closeAddRemoveMembers()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{i18n.t("projects.manageProjectMembers")}</DialogTitle>
          <DialogDescription>
            {i18n.t("projects.manageProjectMembersDescription")}
          </DialogDescription>
        </DialogHeader>
        <EditMembersListForm
          allMemberList={allMemberList}
          currencySymbol={currencySymbol}
          handleSubmit={handleSubmit}
          members={members}
          setMembers={setMembers}
          updateMemberState={updateMemberState}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditMembersList;
