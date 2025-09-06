import React, { useEffect, useState } from "react";

import { projectApi } from "apis/api";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import ProjectList from "./List";
import Header from "./List/Header";
import ProjectForm from "./List/Mobile/ProjectForm";
import AddEditProject from "./Modals/AddEditProject";
import DeleteProject from "./Modals/DeleteProject";

const Projects = ({ isAdminUser }) => {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editProjectData, setEditProjectData] = useState({});
  const [deleteProjectData, setDeleteProjectData] = useState({});
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDesktop } = useUserContext();

  const fetchProjects = async () => {
    const res = await projectApi.get();
    setProjects(res.data.projects);
    setLoading(false);
  };

  useEffect(() => {
    sendGAPageView();
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
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
