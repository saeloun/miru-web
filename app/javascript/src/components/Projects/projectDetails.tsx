import * as React from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import projectsAPI from "apis/projects";
import { Member } from "./member";
import { minutesToHHMM } from "../../helpers/hhmm-parser";

const ProjectDetails = ({ id, editIcon, deleteIcon, isAdminUser }) => {

  const [project, setProject] = React.useState({});

  const fetchProject = () => {
    projectsAPI.show(id)
      .then(res => setProject(res.data.project))
      .catch (err => {console.log(err);});
  };

  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchProject();
  }, []);

  return (

    <>
      <div>Showing details for project {id}</div>
      <div>Project-name: {project.name}</div>
      <div>Project name: {project.name}</div>
      <div>Client name: {project.clientName}</div>
      <div>Billable: {project.isBillable}</div>
      <div>Minutes spent(week): {project.minutesSpent}</div>
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
                  {project?.projectMembers?.map((member, index) => (
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
