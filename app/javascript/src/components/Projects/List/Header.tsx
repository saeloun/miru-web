import React from "react";

import Logger from "js-logger";
import { PlusIcon } from "miruIcons";

import projectApi from "apis/projects";
import AutoSearch from "common/AutoSearch";

import SearchDataRow from "./SearchDataRow";

const Header = ({ setShowProjectModal, isAdminUser }) => {
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
      className={`m-4 flex items-center lg:mx-0 lg:mt-6 lg:mb-3 ${
        isAdminUser ? "justify-between" : ""
      }`}
    >
      <h2 className="header__title hidden lg:inline">Projects</h2>
      {isAdminUser && (
        <>
          <AutoSearch
            SearchDataRow={SearchDataRow}
            searchAction={fetchProjects}
          />
          <button
            className="header__button flex"
            onClick={() => setShowProjectModal(true)}
          >
            <PlusIcon size={16} weight="fill" />
            <span className="ml-2 inline-block hidden lg:inline">
              NEW PROJECT
            </span>
          </button>
        </>
      )}
    </div>
  );
};

export default Header;
