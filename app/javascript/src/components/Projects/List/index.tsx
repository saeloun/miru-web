import React from "react";

import Logger from "js-logger";
import { ToastContainer } from "react-toastify";

import projectApi from "apis/projects";
import withLayout from "common/Mobile/HOC/withLayout";
import { TOASTER_DURATION } from "constants/index";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "./Header";
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

  const fetchProjects = async () => {
    try {
      const res = await projectApi.get();
      setProjects(res.data.projects);
    } catch (err) {
      Logger.error(err);
    }
  };

  React.useEffect(() => {
    sendGAPageView();
    fetchProjects();
  }, []);

  return (
    <React.Fragment>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header
        isAdminUser={isAdminUser}
        setShowProjectModal={setShowProjectModal}
      />
      <div className="flex flex-col" data-cy="projects-list">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden">
              <table className="mt-4 min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table__header" scope="col">
                      PROJECT/CLIENT
                    </th>
                    <th className="table__header" scope="col" />
                    <th className="table__header text-right" scope="col">
                      HOURS LOGGED
                    </th>
                    <th className="table__header" scope="col" />
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
            </div>
          </div>
        </div>
      </div>
      {showProjectModal && (
        <AddEditProject
          editProjectData={editProjectData}
          setEditProjectData={setEditProjectData}
          setShowProjectModal={setShowProjectModal}
        />
      )}
      {showDeleteDialog && (
        <DeleteProject
          fetchProjectList={fetchProjects}
          project={deleteProjectData}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      )}
    </React.Fragment>
  );
};

const ProjectsLayout = () => {
  const { isDesktop } = useUserContext();
  const Main = withLayout(ProjectList, !isDesktop, !isDesktop);

  return Main;
};

export default ProjectsLayout;
