import * as React from "react";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projects from "apis/projects";
import { Project } from "./project";
import ProjectDetails from "./projectDetails";
import ProjectList from "./projectList";

const Projects = (isAdminUser) => {
  const [allProjects, setAllProjects] = React.useState([]);
  const [showProjectDetails, setShowProjectDetails] = React.useState(null);

  const fetchProjects = async () => {
    const res = await projects.get();
    if (res.status == 200) {
      setAllProjects(res.data.projects);
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
        id={showProjectDetails}/> :
      <ProjectList
        allProjects={allProjects}
        isAdminUser={isAdminUser}
        projectClickHandler={projectClickHandler}/>
  );

};

export default Projects;
