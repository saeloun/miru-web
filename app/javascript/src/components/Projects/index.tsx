import React, { useEffect, useState } from "react";

import Logger from "js-logger";

import projectApi from "apis/projects";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import { IProject } from "./interface";
import ProjectList from "./List";
import Header from "./List/Header";
import ProjectForm from "./List/Mobile/ProjectForm";
import AddEditProject from "./Modals/AddEditProject";
import DeleteProject from "./Modals/DeleteProject";

const Projects = ({ isAdminUser }) => {
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
      <ProjectList
        isAdminUser={isAdminUser}
        projects={projects}
        setDeleteProjectData={setDeleteProjectData}
        setEditProjectData={setEditProjectData}
        setShowDeleteDialog={setShowDeleteDialog}
        setShowProjectModal={setShowProjectModal}
      />
      {showProjectModal && isDesktop && (
        <AddEditProject
          editProjectData={editProjectData}
          fetchProjectList={fetchProjects}
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

export default Projects;
