import * as React from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projectAPI from "apis/projects";
import { Member } from "./member";

export interface IProjectDetails {
  id: number;
  name: string;
  client: any;
  is_billable: boolean;
  total_minutes_logged: number;
  members: any;
  editIcon: string;
  deleteIcon: string;
  isAdminUser: boolean;
  setShowEditDialog: any;
  setProjectToEdit: any;
  setProjectToDelete: any;
  setShowDeleteDialog: any;
  projectClickHandler: any;
}

const ProjectDetails = ({ id, editIcon, deleteIcon, isAdminUser }) => {

  const [project, setProject] = React.useState<IProjectDetails>();

  const fetchProject = async () => {

    try {
      const resp = await projectAPI.show(id);
      setProject(resp.data.project_details);
    } catch (err) {
      // Add error handling
    }

  };

  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchProject();
  }, []);

  return (
    <>
      <div>Showing details for project {id}</div>
      <div>Project name: {project?.name}</div>
      <div>Client name: {project?.client.name}</div>
      <div>Billable: {project?.is_billable}</div>
      <div>Minutes spent(week): {project?.total_minutes_logged}</div>
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
                      MEMBER
                    </th>
                    <th
                      scope="col"
                      className="table__header"
                    >
                    HOURLY RATE
                    </th>
                    <th
                      scope="col"
                      className="table__header text-right"
                    >
                      HOURS LOGGED
                    </th>
                    <th scope="col" className="table__header">
                    COST
                    </th>
                    <th scope="col" className="table__header"></th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {project?.members?.map((member, index) => (
                    <Member
                      key={index}
                      {...member}
                      isAdminUser={isAdminUser}
                      editIcon={editIcon}
                      deleteIcon={deleteIcon}
                      /*  setShowEditDialog={setShowEditDialog}
                    setProjectToEdit={setProjectToEdit}
                    setShowDeleteDialog={setShowDeleteDialog}
                    setProjectToDelete={setProjectToDelete} */
                    />
                  ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </>
  );

};
export default ProjectDetails;
