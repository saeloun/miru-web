import * as React from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projectApi from "apis/projects";
import ProjectDetails from "./Details";
import { IProject } from "./interface";
import ProjectList from "./List";

const Projects = ({ isAdminUser }) => {
  const [projects, setProjects] = React.useState<IProject[]>([]);
  const [showProjectDetails, setShowProjectDetails] = React.useState(null);

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
    showProjectDetails ?
      <ProjectDetails
        id={showProjectDetails}
      /> :
      <ProjectList
        allProjects={projects}
        isAdminUser={isAdminUser}
        projectClickHandler={projectClickHandler}/>
  );

};

export default Projects;
