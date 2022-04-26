import * as React from "react";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projectApi from "apis/projects";
import Header from "./Header";
import { Project } from "./project";
import { IProject } from "../interface";
import AddEditProject from "../Modals/AddEditProject";
import DeleteProject from "../Modals/DeleteProject";

export const ProjectList = ({ isAdminUser }) => {

  const [showProjectModal, setShowProjectModal] = React.useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<boolean>(false);
  const [editProjectData, setEditProjectData] = React.useState<any>(null);
  const [deleteProjectData, setDeleteProjectData] = React.useState({});
  const [projects, setProjects] = React.useState<IProject[]>([]);

  const fetchProjects = async () => {
    await projectApi.get()
      .then(resp => {
        setProjects(resp.data.projects);
      }).catch(() => {
        //error handling
      });
  };

  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchProjects();
  }, []);

  return (
    <React.Fragment>
      <ToastContainer />
      <Header
        setShowProjectModal={setShowProjectModal}
      />
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 mt-4">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="table__header"
                    >
                      PROJECT/CLIENT
                    </th>
                    <th
                      scope="col"
                      className="table__header"
                    >

                    </th>
                    <th
                      scope="col"
                      className="table__header text-right"
                    >
                      HOURS LOGGED
                    </th>
                    <th scope="col" className="table__header"></th>
                    <th scope="col" className="table__header"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project, index) => (
                    <Project
                      key={index}
                      {...project}
                      isAdminUser={isAdminUser}
                      setShowProjectModal={setShowProjectModal}
                      setEditProjectData={setEditProjectData}
                      setShowDeleteDialog={setShowDeleteDialog}
                      setDeleteProjectData={setDeleteProjectData}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showProjectModal &&
        <AddEditProject
          setShowProjectModal={setShowProjectModal}
          setEditProjectData={setEditProjectData}
          editProjectData={editProjectData}
        />
      }
      {showDeleteDialog && (
        <DeleteProject
          setShowDeleteDialog={setShowDeleteDialog}
          project={deleteProjectData}
        />
      )}
    </React.Fragment>
  );
};

export default ProjectList;
