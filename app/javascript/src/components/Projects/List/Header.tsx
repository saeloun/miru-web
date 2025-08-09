import React from "react";

import projectApi from "apis/projects";
import AutoSearch from "common/AutoSearch";
import { useUserContext } from "context/UserContext";
import Logger from "js-logger";
import { PlusIcon } from "miruIcons";
import { Button } from "StyledComponents";

import SearchDataRow from "./SearchDataRow";

const Header = ({ projectDataPresent, setShowProjectModal, isAdminUser }) => {
  const { isDesktop } = useUserContext();

  const fetchProjects = async searchString => {
    try {
      const res = await projectApi.search(searchString);

      return res?.data?.projects;
    } catch (error) {
      Logger.error(error);
    }
  };

  return (
    <div
      className={`m-4 flex items-center  lg:mx-0 lg:mt-6 lg:mb-3 ${
        isAdminUser &&
        `${isDesktop || projectDataPresent ? "justify-between" : "justify-end"}`
      }`}
    >
      <h2 className="header__title hidden lg:inline">Projects</h2>
      {isAdminUser && (
        <>
          {projectDataPresent && (
            <AutoSearch
              SearchDataRow={SearchDataRow}
              searchAction={fetchProjects}
            />
          )}
          <Button
            className="ml-2 flex items-center px-2 py-2 lg:ml-0 lg:px-4"
            style="secondary"
            onClick={() => setShowProjectModal(true)}
          >
            <PlusIcon size={16} weight="bold" />
            <span className="ml-2 hidden text-base font-bold tracking-widest lg:inline-block">
              New Project
            </span>
          </Button>
        </>
      )}
    </div>
  );
};

export default Header;
