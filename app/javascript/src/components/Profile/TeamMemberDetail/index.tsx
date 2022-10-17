/* eslint-disable @typescript-eslint/no-var-requires */

import React, { useEffect, useState } from "react";

import { Multiselect } from 'multiselect-react-dropdown';

import companyUsersApi from "apis/company-users";
import teamMemberApi from "apis/profiles/team-members";
import Loader from "common/Loader/index";

import Header from "../Header";

const TeamMemberDetails = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [allMemberList, setAllMemberList] = useState<any>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<any>([]);
  const [teamMembers, setTeamMembers] = useState<any>([]);
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchCurrentWorkspaceUsers();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSelectedMembers()
  }, [allMemberList]);

  const excludeCurrentUser = (allMembers: any) => allMembers.filter((memberFromAllMembers: any) => ( userId !== memberFromAllMembers.id));

  const fetchCurrentWorkspaceUsers = async () => {
    const resp = await companyUsersApi.get();
    setAllMemberList(excludeCurrentUser(resp.data.users));
  };

  const fetchSelectedMembers = () => {
    if (allMemberList.length === 0)  return

    teamMemberApi.get().then((res) => {
      const selectedMembers = allMemberList.filter((member: any) => res.data.user.team_member_ids.map(Number).includes(parseInt(member.id)));
      setSelectedTeamMembers(selectedMembers);
    })
  }

  const addRemoveStack = (selectedList: any) => {
    setSelectedTeamMembers(selectedList);
    setTeamMembers(selectedList.map((i: any) => parseInt(i.id)));
    setIsDetailUpdated(true)
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    await teamMemberApi.update({ user: { team_member_ids: teamMembers } });
    setIsDetailUpdated(false);
    setIsLoading(false);
  };

  const handleCancelAction = () => {
    fetchSelectedMembers()
    setIsDetailUpdated(false);
  };

  return (
    <div className="flex flex-col w-4/5">
      <Header
        title={"Team Members"}
        subTitle={"View and manage team members"}
        showButtons={true}
        cancelAction={handleCancelAction}
        saveAction={handleUpdateProfile}
        isDisableUpdateBtn={isDetailUpdated}
      />
      {isLoading ? <Loader /> : (
        <div className="pb-10 pt-10 pl-10 pr-10 mt-4 bg-miru-gray-100 min-h-80v">
          <div className="flex flex-row py-6">
            <div className="w-4/12 font-bold p-2">Team Members</div>
            <div className="w-full p-2">
            </div>
          </div>
          <Multiselect
            closeOnSelect={true}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full"
            selectedValues={selectedTeamMembers}
            options={allMemberList ? allMemberList : [{}]}
            name="team_member_ids"
            onSelect={((selectedList) => addRemoveStack(selectedList))}
            onRemove={((selectedList) => addRemoveStack(selectedList))}
            displayValue="name" />
        </div>
      )}
    </div>
  );
};

export default TeamMemberDetails;
