import * as React from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projectApi from "apis/projects";
import ProjectDetails from "./Details";
import Header from "./Header";
import { IProject } from "./interface";
import ProjectList from "./List";
import ProjectModal from "./ProjectModal";

const Projects = ({ isAdminUser }) => {

  const [showProjectDetails, setShowProjectDetails] = React.useState(null);
  const [projects, setProjects] = React.useState<IProject[]>([]);

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
    if (isAdminUser)
    { setShowProjectDetails(id); }
  };

  return (
    <React.Fragment>
      {showProjectDetails ?
        <ProjectDetails
          id={showProjectDetails}
        /> :
        <ProjectList
          allProjects={projects}
          isAdminUser={isAdminUser}
          projectClickHandler={projectClickHandler}
        />}
    </React.Fragment>
  );

};

export default Projects;
