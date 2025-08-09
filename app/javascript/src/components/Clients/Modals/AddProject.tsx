import React, { useState } from "react";

import projectApi from "apis/projects";
import { XIcon } from "miruIcons";
import { Modal } from "StyledComponents";

const AddProject = ({
  showProjectModal,
  setShowProjectModal,
  clientDetails,
  fetchProjectList,
}) => {
  const [client, setClient] = useState<any>(null);
  const [projectName, setProjectName] = useState<any>(null);
  const [projectType, setProjectType] = useState<any>("Billable");

  const handleSubmit = async () => {
    await projectApi.create({
      project: {
        client_id: client,
        name: projectName,
        billable: projectType === "Billable",
      },
    });
    setShowProjectModal(false);
    fetchProjectList();
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showProjectModal}
      onClose={() => setShowProjectModal(false)}
    >
      <div className="modal__position">
        <h6 className="modal__title"> Add New Project </h6>
        <div className="modal__close">
          <button
            className="modal__button"
            onClick={() => {
              setShowProjectModal(false);
            }}
          >
            <XIcon color="#CDD6DF" size={15} />
          </button>
        </div>
      </div>
      <div className="modal__form flex-col">
        <div className="mt-4">
          <div className="field">
            <div className="field_with_errors">
              <label className="block text-xs font-normal tracking-wider text-miru-dark-purple-1000">
                Client
              </label>
            </div>
            <div className="mt-1">
              <select
                className="focus:outline-none block h-8 w-full rounded border-0 bg-miru-gray-100 px-2 py-1 text-sm font-medium text-miru-dark-purple-1000 sm:text-base"
                defaultValue={client}
                onChange={e => setClient(e.target.value)}
              >
                <option value="0">Select Client</option>
                <option value={clientDetails.id}>{clientDetails.name}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="field">
            <div className="field_with_errors">
              <label className="block text-xs font-normal tracking-wider text-miru-dark-purple-1000">
                Project Name
              </label>
            </div>
            <div className="mt-1">
              <input
                className="focus:outline-none block h-8 w-full appearance-none rounded border-0 bg-miru-gray-100 px-3 py-2 text-sm font-medium text-miru-dark-purple-1000 sm:text-base"
                placeholder=" Enter Project Name"
                type="text"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="field">
            <label className="block text-xs font-normal tracking-wider text-miru-dark-purple-1000">
              Project Type
            </label>
            <div className="mt-1">
              <div className="sm:space-XIcon-10 flex w-57.5 items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center">
                  <input
                    defaultChecked
                    className="h-4 w-4 cursor-pointer border-miru-han-purple-1000 text-miru-dark-purple-1000 focus:ring-miru-han-purple-1000"
                    id="billable"
                    name="project_type"
                    type="radio"
                    onClick={() => setProjectType("Billable")}
                  />
                  <label
                    className="ml-3 block text-sm font-medium text-miru-dark-purple-1000"
                    htmlFor="billable"
                  >
                    Billable
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    className="bg--miru-han-purple-1000 h-4 w-4 cursor-pointer border-miru-han-purple-1000 text-miru-dark-purple-1000 focus:ring-miru-han-purple-1000"
                    defaultChecked={false}
                    id="non-billable"
                    name="project_type"
                    type="radio"
                    onClick={() => setProjectType("Non-Billable")}
                  />
                  <label
                    className="ml-3 block text-sm font-medium text-miru-dark-purple-1000 "
                    htmlFor="non-billable"
                  >
                    Non-billable
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="actions mt-4">
          {client && projectName && projectType ? (
            <button
              className="focus:outline-none flex h-10 w-full cursor-pointer justify-center rounded border border-transparent bg-miru-han-purple-1000 py-1 px-4 font-sans text-base font-medium tracking-widest text-miru-white-1000 shadow-sm hover:bg-miru-han-purple-600"
              type="submit"
              onClick={() => handleSubmit()}
            >
              {" "}
              ADD PROJECT{" "}
            </button>
          ) : (
            <button
              disabled
              className="focus:outline-none flex h-10 w-full cursor-pointer justify-center rounded border border-transparent bg-miru-gray-1000 py-1 px-4 font-sans text-base font-medium tracking-widest text-miru-white-1000 shadow-sm"
              type="submit"
            >
              {" "}
              ADD PROJECT{" "}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddProject;
