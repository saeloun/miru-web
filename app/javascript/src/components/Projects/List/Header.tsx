import React, { useCallback } from "react";

import { projectApi } from "apis/api";
import { UnifiedSearch } from "../../ui/enhanced-search";
import { useUserContext } from "context/UserContext";
import Logger from "js-logger";
import { Plus } from "phosphor-react";
import { Button } from "components/ui/button";

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
      className={`m-4 flex flex-col gap-3 sm:flex-row sm:items-center lg:mx-0 lg:mt-6 lg:mb-3 ${
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
              className="w-full sm:w-64"
              variant="input"
              size="md"
              groupByType={false}
              highlightMatches={true}
              minSearchLength={1}
            />
          )}
          <Button
            className="ml-0 flex h-11 w-full items-center justify-center gap-2 px-4 sm:ml-2 sm:w-auto lg:ml-0"
            type="button"
            variant="default"
            onClick={() => setShowProjectModal(true)}
          >
            <Plus size={16} />
            <span className="hidden text-sm font-medium lg:inline-block">
              New Project
            </span>
          </Button>
        </>
      )}
    </div>
  );
};

export default Header;
