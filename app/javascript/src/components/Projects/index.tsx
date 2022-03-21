import * as React from "react";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projects from "apis/projects";
import { Project } from "./project";
import ProjectDetails from "./projectDetails";
import ProjectList from "./projectList";

const Projects = ({ editIcon, deleteIcon, isAdminUser }) => {
  const [allProjects, setAllProjects] = React.useState([]);
  const [showProjectDetails, setShowProjectDetails] = React.useState(null);

  const fetchProjects = () => {

    projects.get()
      .then(res => setAllProjects(res.data.projects))
      .catch(err => console.log(err));

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
        allProjects={allProjects}
        isAdminUser={isAdminUser}
        projectClickHandler={projectClickHandler}/>
  );

};

export default Projects;
