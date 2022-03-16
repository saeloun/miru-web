import * as React from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projects from "apis/projects";

const Projects = () => {
  const [allProjects, setAllProjects] = React.useState([]);

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

  return (
    <div>
      {allProjects.map(p => <div>{p.id}</div>)}
    </div>
  );

};

export default Projects;
