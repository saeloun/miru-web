import * as React from "react";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projectApi from "apis/projects";
import { IProject } from "./project";
import ProjectDetails from "./projectDetails";
import ProjectList from "./projectList";

const Projects = ({ editIcon, deleteIcon, isAdminUser }) => {
  const [projects, setProjects] = React.useState<IProject[]>([]);
  const [showProjectDetails, setShowProjectDetails] = React.useState(null);

  const fetchProjects = async () => {

    try {
      const resp = await projectApi.get();
      setProjects(resp.data.projects);
    } catch (error)
    {console.log(error);}
     
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
        isAdminUser={isAdminUser}
        editIcon={editIcon}
        deleteIcon={deleteIcon}/> :
      <ProjectList
        allProjects={projects}
        isAdminUser={isAdminUser}
        projectClickHandler={projectClickHandler}/>
  );

};

export default Projects;
