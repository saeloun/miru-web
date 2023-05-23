import React, { useEffect, useState } from "react";

import Logger from "js-logger";

import projectApi from "apis/projects";
import EmptyStates from "common/EmptyStates";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "./Header";
import ProjectForm from "./Mobile/ProjectForm";
import { Project } from "./project";

import { IProject } from "../interface";
import AddEditProject from "../Modals/AddEditProject";
import DeleteProject from "../Modals/DeleteProject";

const ProjectList = ({ isAdminUser }) => {
  const [showProjectModal, setShowProjectModal] =
    React.useState<boolean>(false);

  const [showDeleteDialog, setShowDeleteDialog] =
    React.useState<boolean>(false);
  const [editProjectData, setEditProjectData] = React.useState<any>({});
  const [deleteProjectData, setDeleteProjectData] = React.useState({});
  const [projects, setProjects] = React.useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDesktop } = useUserContext();

  const fetchProjects = async () => {
    try {
      const res = await projectApi.get();
      setProjects(res.data.projects);
      setLoading(false);
    } catch (err) {
      Logger.error(err);
    }
  };

  useEffect(() => {
    sendGAPageView();
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <p className="tracking-wide flex min-h-screen items-center justify-center text-base font-medium text-miru-han-purple-1000">
        Loading...
      </p>
    );
  }

  const ProjectsLayout = () => (
    <div>
      <Header
        isAdminUser={isAdminUser}
        projectDataPresent={Boolean(projects.length)}
        setShowProjectModal={setShowProjectModal}
      />
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden">
              {projects && projects.length > 0 ? (
                <table className="mt-4 min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table__header" scope="col">
                        PROJECT/CLIENT
                      </th>
                      <th
                        className="table__header hidden lg:table-cell"
                        scope="col"
                      />
                      <th
                        className="table__header hidden text-right lg:table-cell"
                        scope="col"
                      >
                        HOURS LOGGED
                      </th>
                      <th
                        className="table__header text-right lg:hidden"
                        scope="col"
                      >
                        HOURS
                      </th>
                      <th
                        className="table__header hidden lg:table-cell"
                        scope="col"
                      />
                      <th className="table__header" scope="col" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {projects.map((project, index) => (
                      <Project
                        key={index}
                        {...project}
                        isAdminUser={isAdminUser}
                        setDeleteProjectData={setDeleteProjectData}
                        setEditProjectData={setEditProjectData}
                        setShowDeleteDialog={setShowDeleteDialog}
                        setShowProjectModal={setShowProjectModal}
                      />
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyStates
                  Message="Looks like there aren’t any projects added yet."
                  messageClassName="w-full lg:mt-5"
                  showNoSearchResultState={false}
                  wrapperClassName="mt-5"
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {showProjectModal && isDesktop && (
        <AddEditProject
          editProjectData={editProjectData}
          setEditProjectData={setEditProjectData}
          setShowProjectModal={setShowProjectModal}
          showProjectModal={showProjectModal}
        />
      )}
      {showDeleteDialog && (
        <DeleteProject
          fetchProjectList={fetchProjects}
          project={deleteProjectData}
          setShowDeleteDialog={setShowDeleteDialog}
          showDeleteDialog={showDeleteDialog}
        />
      )}
    </div>
  );

  const Main = withLayout(ProjectsLayout, !isDesktop, !isDesktop);

  if (!isDesktop) {
    if (showProjectModal) {
      return (
        <ProjectForm
          editProjectData={editProjectData}
          fetchProjects={fetchProjects}
          setEditProjectData={setEditProjectData}
          setShowProjectModal={setShowProjectModal}
        />
      );
    }

    return <Main />;
  }

  return ProjectsLayout();
};

export default ProjectList;
