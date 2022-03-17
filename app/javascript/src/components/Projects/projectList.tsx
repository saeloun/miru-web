import * as React from "react";
import { ToastContainer } from "react-toastify";
import { Project } from "./project";

export const ProjectList = ({ allProjects, isAdminUser, projectClickHandler }) => (
  <>
    <ToastContainer />
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
                {allProjects.map((project, index) => (
                  <Project
                    key={index}
                    {...project}
                    isAdminUser={isAdminUser}
                    onClick={projectClickHandler}
                    /* editIcon={editIcon}
                      deleteIcon={deleteIcon}
                      setShowEditDialog={setShowEditDialog}
                      setProjectToEdit={setProjectToEdit}
                      setShowDeleteDialog={setShowDeleteDialog}
                      setProjectToDelete={setProjectToDelete} */
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    {/* {showEditDialog ? (
        <EditProject
          setShowEditDialog={setShowEditDialog}
          project={projectToEdit}
        />
      ) : null}
      {showDeleteDialog && (
        <DeleteProject
          setShowDeleteDialog={setShowDeleteDialog}
          project={projectToDelete}
        />
      )} */}
  </>
);

export default ProjectList;
