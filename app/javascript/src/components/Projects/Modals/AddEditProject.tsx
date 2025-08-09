import React, { useEffect, useState } from "react";

import projectApi from "apis/projects";
import Logger from "js-logger";
import { XIcon } from "miruIcons";
import { Modal } from "StyledComponents";

const AddEditProject = ({
  setEditProjectData,
  editProjectData,
  setShowProjectModal,
  showProjectModal,
  projectData,
  fetchProjectList,
}) => {
  const [client, setClient] = useState<number>(0);
  const [projectName, setProjectName] = useState<string>("");
  const [projectType, setProjectType] = useState<string>("Billable");
  const [clientList, setClientList] = useState<[]>([]);

  const projectId =
    (projectData && projectData["id"]) ||
    (editProjectData && editProjectData["id"]) ||
    Number(window.location.pathname.split("/").at(-1));

  const isEdit = !!projectId;
  const isFormFilled = client && projectName && projectType;
  const showEditModal = isEdit && editProjectData?.members;

  const getClientList = async () => {
    try {
      const { data } = await projectApi.get();
      setClientList(data.clients);
    } catch (error) {
      Logger.error(error);
    }
  };

  const getProject = async () => {
    if (!editProjectData.members) {
      try {
        const { data } = await projectApi.show(projectId);
        setEditProjectData(data.project_details);
      } catch (error) {
        Logger.error(error);
      }
    }
  };

  const handleProjectData = () => {
    if (!editProjectData?.name || !clientList.length) return;
    const clientName =
      editProjectData?.client?.name || editProjectData?.clientName;

    const currentClient = clientList.find(
      clientItem => clientItem["name"] === clientName
    );
    if (currentClient) setClient(currentClient["id"]);
    setProjectName(isEdit ? editProjectData.name : "");
    setProjectType(
      editProjectData.is_billable || editProjectData.isBillable
        ? "Billable"
        : "Non-Billable"
    );
  };

  const editProject = async () => {
    await projectApi.update(editProjectData.id, {
      project: {
        client_id: client,
        name: projectName,
        billable: projectType === "Billable",
      },
    });
    setEditProjectData("");
    setShowProjectModal(false);
    fetchProjectList();
  };

  const createProject = async () => {
    await projectApi.create({
      project: {
        client_id: client,
        name: projectName,
        billable: projectType === "Billable",
      },
    });
    setEditProjectData("");
    fetchProjectList();
    setShowProjectModal(false);
  };

  const handleSubmit = () => {
    if (isEdit) {
      editProject();
    } else {
      createProject();
    }
  };

  useEffect(() => {
    getClientList();
    if (isEdit) getProject();
  }, []);

  useEffect(() => {
    handleProjectData();
  }, [editProjectData, clientList]);

  return !isEdit || showEditModal ? (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showProjectModal}
      onClose={() => setShowProjectModal(false)}
    >
      <div className="modal__position">
        <h6 className="modal__title">
          {isEdit ? "Edit Project Details" : "Add New Project"}
        </h6>
        <div className="modal__close">
          <button
            className="modal__button"
            onClick={() => {
              setEditProjectData("");
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
                id="select-client"
                onChange={event => setClient(Number(event.target.value))}
              >
                <option value="0">Select Client</option>
                {clientList &&
                  clientList.map((event, index) => (
                    <option
                      key={index}
                      selected={event["id"] == client}
                      value={event["id"]}
                    >
                      {event["name"]}
                    </option>
                  ))}
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
                id="project-name"
                placeholder=" Enter Project Name"
                type="text"
                value={projectName}
                onChange={event => setProjectName(event.target.value)}
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
                  {(editProjectData || !isEdit) && (
                    <input
                      className="h-4 w-4 cursor-pointer border-miru-han-purple-1000 text-miru-dark-purple-1000 focus:ring-miru-han-purple-1000"
                      id="billable"
                      name="project_type"
                      type="radio"
                      defaultChecked={
                        isEdit ? editProjectData.is_billable : true
                      }
                      onClick={() => setProjectType("Billable")}
                    />
                  )}
                  <label
                    className="ml-3 block text-sm font-medium text-miru-dark-purple-1000"
                    htmlFor="billable"
                  >
                    Billable
                  </label>
                </div>
                <div className="flex items-center">
                  {(editProjectData || !isEdit) && (
                    <input
                      className="bg--miru-han-purple-1000 h-4 w-4 cursor-pointer border-miru-han-purple-1000 text-miru-dark-purple-1000 focus:ring-miru-han-purple-1000"
                      id="non-billable"
                      name="project_type"
                      type="radio"
                      defaultChecked={
                        isEdit ? !editProjectData.is_billable : false
                      }
                      onClick={() => setProjectType("Non-Billable")}
                    />
                  )}
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
          <button
            disabled={!isFormFilled}
            type="submit"
            className={`focus:outline-none flex h-10 w-full cursor-pointer justify-center rounded border border-transparent py-1 px-4 font-sans text-base font-medium tracking-widest text-miru-white-1000 shadow-sm ${
              isFormFilled
                ? "bg-miru-han-purple-1000 hover:bg-miru-han-purple-600 "
                : " bg-miru-gray-1000"
            }`}
            onClick={handleSubmit}
          >
            {isEdit ? "SAVE CHANGES" : "ADD PROJECT"}
          </button>
        </div>
      </div>
    </Modal>
  ) : null;
};

AddEditProject.defaultProps = {
  projectData: {},
};

export default AddEditProject;
