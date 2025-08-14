import React, { useCallback } from "react";

import projectApi from "apis/projects";
import { UnifiedSearch } from "../../ui/enhanced-search";
import { useUserContext } from "context/UserContext";
import Logger from "js-logger";
import { PlusIcon } from "miruIcons";
import { Button } from "StyledComponents";

const Header = ({ projectDataPresent, setShowProjectModal, isAdminUser }) => {
  const { isDesktop } = useUserContext();

  const fetchProjects = useCallback(async searchString => {
    try {
      const res = await projectApi.search(searchString);

      // Transform the API response to match SearchItem interface
      return (
        res?.data?.projects?.map(project => ({
          id: project.id,
          label: project.name,
          name: project.name,
          type: "project" as const,
          subtitle: project.client_name || project.description,
          description: project.description,
          ...project,
        })) || []
      );
    } catch (error) {
      Logger.error(error);

      return [];
    }
  }, []);

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
            <UnifiedSearch
              searchAction={fetchProjects}
              placeholder="Search projects..."
              onSelect={project => {
                // Handle project selection if needed
              }}
              className="w-64"
              variant="input"
              size="md"
              groupByType={false}
              highlightMatches={true}
              minSearchLength={1}
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
