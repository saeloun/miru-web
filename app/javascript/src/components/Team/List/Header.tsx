import { TeamModalType } from "constants/index";

import React, { useCallback } from "react";

import { teamApi } from "apis/api";
import { UnifiedSearch } from "../../ui/enhanced-search";
import { useList } from "context/TeamContext";
import { unmapList } from "mapper/team.mapper";
import { PlusIcon } from "miruIcons";
import { Button } from "StyledComponents";

const Header = () => {
  const { setModalState } = useList();

  const fetchTeamList = useCallback(async searchString => {
    try {
      const res = await teamApi.search(searchString);
      const dropdownList = unmapList(res);

      // Transform for enhanced search
      return (
        dropdownList?.map(member => ({
          id: member.id,
          label: member.name,
          name: member.name,
          type: "team" as const,
          subtitle: member.email,
          avatar: member.avatar,
          ...member,
        })) || []
      );
    } catch (error) {
      console.error("Team search error:", error);

      return [];
    }
  }, []);

  return (
    <div className="mt-6 mb-3 flex items-center justify-between">
      <h2 className="header__title hidden lg:inline">Team</h2>
      <UnifiedSearch
        searchAction={fetchTeamList}
        placeholder="Search team members..."
        onSelect={member => {
          // Handle team member selection if needed
        }}
        className="w-64"
        variant="input"
        size="md"
        minSearchLength={1}
      />
      <div className="flex justify-end">
        <Button
          className="ml-2 flex items-center px-2 py-2 lg:ml-0 lg:px-4"
          style="secondary"
          onClick={() => setModalState(TeamModalType.ADD_EDIT)}
        >
          <PlusIcon size={16} weight="bold" />
          <span className="ml-2 hidden text-base font-bold tracking-widest lg:inline-block">
            New User
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Header;
