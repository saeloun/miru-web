import React from "react";

import EmptyStates from "common/EmptyStates";

import { Project } from "./Project";

const ProjectList = ({
  isAdminUser,
  projects,
  setDeleteProjectData,
  setEditProjectData,
  setShowDeleteDialog,
  setShowProjectModal,
}) => (
  <div>
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden">
            {projects && projects.length > 0 ? (
              <table className="mt-4 min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table__header" scope="col">
                      PROJECT/CLIENT
                    </th>
                    <th
                      className="table__header hidden lg:table-cell"
                      scope="col"
                    />
                    <th
                      className="table__header hidden text-right lg:table-cell"
                      scope="col"
                    >
                      HOURS LOGGED
                    </th>
                    <th
                      className="table__header text-right lg:hidden"
                      scope="col"
                    >
                      HOURS
                    </th>
                    <th
                      className="table__header hidden lg:table-cell"
                      scope="col"
                    />
                    <th className="table__header" scope="col" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {projects.map((project, index) => (
                    <Project
                      key={index}
                      {...project}
                      isAdminUser={isAdminUser}
                      setDeleteProjectData={setDeleteProjectData}
                      setEditProjectData={setEditProjectData}
                      setShowDeleteDialog={setShowDeleteDialog}
                      setShowProjectModal={setShowProjectModal}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyStates
                Message="Looks like there aren’t any projects added yet."
                messageClassName="w-full lg:mt-5"
                showNoSearchResultState={false}
                wrapperClassName="mt-5"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ProjectList;
