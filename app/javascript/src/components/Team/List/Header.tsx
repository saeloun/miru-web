import { TeamModalType } from "constants/index";

import React, { useCallback } from "react";

import { teamApi } from "apis/api";
import { UnifiedSearch } from "../../ui/enhanced-search";
import { useList } from "context/TeamContext";
import { i18n } from "../../../i18n";
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
    <div className="mt-6 mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="header__title hidden lg:inline">{i18n.t("team.team")}</h2>
      <UnifiedSearch
        searchAction={fetchTeamList}
        placeholder={i18n.t("search")}
        onSelect={member => {
          // Handle team member selection if needed
        }}
        className="w-full sm:w-64"
        variant="input"
        size="md"
        minSearchLength={1}
      />
      <div className="flex w-full justify-end sm:w-auto">
        <Button
          className="ml-0 flex w-full items-center justify-center px-2 py-2 sm:ml-2 sm:w-auto lg:ml-0 lg:px-4"
          style="secondary"
          onClick={() => setModalState(TeamModalType.ADD_EDIT)}
        >
          <PlusIcon size={16} weight="bold" />
          <span className="ml-2 hidden text-base font-bold tracking-widest lg:inline-block">
            {i18n.t("team.inviteMember")}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Header;
