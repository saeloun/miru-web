import * as React from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projectApi from "apis/projects";
import ProjectDetails from "./Details";
import Header from "./Header";
import { IProject } from "./interface";
import ProjectList from "./List";
import ProjectModal from "./ProjectModal";

const Projects = ({ isAdminUser }) => {
  const [projects, setProjects] = React.useState<IProject[]>([]);
  const [showProjectDetails, setShowProjectDetails] = React.useState(null);
  const [showProjectModal,setShowProjectModal] =React.useState<boolean>(false);
  const [editProjectId,setEditProjectId]=React.useState(null);

  const fetchProjects = async () => {

    try {
      const resp = await projectApi.get();
      setProjects(resp.data.projects);
    } catch (error) {
      // Add error handling
    }
  };

  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchProjects();
  }, []);

  const projectClickHandler = (id) => {
    setShowProjectDetails(id);
  };

  return (
    <React.Fragment>
      { isAdminUser && <Header
        setShowProjectModal={setShowProjectModal}
      />}
      {showProjectDetails ?
        <ProjectDetails
          id={showProjectDetails}
        /> :
        <ProjectList
          allProjects={projects}
          isAdminUser={isAdminUser}
          projectClickHandler={projectClickHandler}
          setShowProjectModal={setShowProjectModal}
          setEditProjectId={setEditProjectId}
        />}

      {
        showProjectModal &&
          <ProjectModal
            setShowProjectModal={setShowProjectModal}
            editProjectId={editProjectId}
            allprojects={projects}
          />
      }
    </React.Fragment>
  );

};

export default Projects;
