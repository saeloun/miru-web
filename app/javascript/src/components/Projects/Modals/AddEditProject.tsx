import React, { useEffect, useState } from "react";
import projectApi from "apis/projects";
import Logger from "js-logger";
import { X } from "phosphor-react";

const AddEditProject = ({
  setEditProjectData,
  editProjectData,
  setShowProjectModal,
  projectData
}) => {
  const [client, setClient] = useState<number>(0);
  const [projectName, setProjectName] = useState<string>("");
  const [projectType, setProjectType] = useState<string>("Billable");
  const [clientList, setClientList] = useState<[]>([]);

  const projectId = Number(window.location.pathname.split("/").at(-1)) || editProjectData["id"];

  const getClientList = async () => {
    try {
      const { data } = await projectApi.get();
      setClientList(data.clients);
    } catch (error) {
      Logger.error(error);
    }
  };

  const getProject = async () => {
    try {
      const { data } = await projectApi.show(projectId);
      setEditProjectData(data.project_details);
    } catch (error) {
      setEditProjectData({});
    }
  };

  useEffect(() => {
    getClientList();
    if (projectData) getProject();
  }, []);

  const handleProjectData = () => {
    if (!editProjectData?.name || !clientList.length) return;
    const clientName = editProjectData?.client.name || editProjectData?.clientName;
    const currentClient = clientList.find(clientItem => clientItem["name"] === clientName);
    if (currentClient) setClient(currentClient["id"]);
    setProjectName(editProjectData ? editProjectData.name : "");
    setProjectType(editProjectData.is_billable || editProjectData.isBillable ? "Billable" : "Non-Billable");
  };

  useEffect(() => {
    handleProjectData();
  }, [editProjectData, clientList]);

  const handleEdit = () => {
    projectApi.update(editProjectData.id, {
      project: {
        "client_id": client,
        "name": projectName,
        "billable": projectType === "Billable"
      }
    }).then(() => {
      setEditProjectData("");
      setShowProjectModal(false);
      window.location.reload();
    });
  };

  const handleSubmit = () => {
    projectApi.create({
      project: {
        "client_id": client,
        "name": projectName,
        "billable": projectType === "Billable"
      }
    }).then(() => {
      setEditProjectData("");
      window.location.reload();
      setShowProjectModal(false);
    });
  };

  return (
    <div className="modal__modal main-modal" style={{ background: "rgba(29, 26, 49,0.6)" }}>
      <div className="modal__container modal-container">
        <div className="modal__content modal-content">
          <div className="modal__position">
            <h6 className="modal__title">{editProjectData ? "Edit Project Details" : "Add New Project"}</h6>
            <div className="modal__close">
              <button
                className="modal__button"
                onClick={() => {
                  setEditProjectData("");
                  setShowProjectModal(false);
                }}
              >
                <X size={15} color="#CDD6DF" />
              </button>
            </div>
          </div>
          <div className="modal__form flex-col">
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                    Client
                  </label>
                </div>
                <div className="mt-1">
                  <select
                    defaultValue={client}
                    className="rounded border-0 block w-full px-2 py-1 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
                    onChange={(event) => setClient(+ event.target.value)}>
                    <option value='0'>Select Client</option>
                    {clientList &&
                      clientList.map((event, index) => <option key={index} value={event["id"]} selected={event["id"] == client}>{event["name"]}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">
                    Project Name
                  </label>
                </div>
                <div className="mt-1">
                  <input type="text" placeholder=" Enter Project Name" className="rounded appearance-none border-0 block w-full px-3 py-2 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <label className="tracking-wider block text-xs font-normal text-miru-dark-purple-1000">Project Type</label>
                <div className="mt-1">
                  <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                    <div className="flex items-center">
                      <input type="radio" id='billable' name='project_type' defaultChecked={editProjectData ? editProjectData.isBillable : true} className="focus:ring-miru-han-purple-1000 h-4 w-4 border-miru-han-purple-1000 text-miru-dark-purple-1000 cursor-pointer" onClick={() => setProjectType("Billable")} />
                      <label htmlFor="billable" className="ml-3 block text-sm font-medium text-miru-dark-purple-1000">
                        Billable
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input type="radio" id='non-billable' name='project_type' defaultChecked={editProjectData ? !editProjectData.isBillable : false} className="focus:ring-miru-han-purple-1000 h-4 w-4 bg--miru-han-purple-1000 border-miru-han-purple-1000 text-miru-dark-purple-1000 cursor-pointer" onClick={() => setProjectType("Non-Billable")} />
                      <label htmlFor="non-billable" className="ml-3 block text-sm font-medium text-miru-dark-purple-1000 ">
                        Non-billable
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="actions mt-4">
              {client && projectName && projectType ?
                <button type="submit" className="tracking-widest h-10 w-full flex justify-center py-1 px-4 border border-transparent shadow-sm text-base font-sans font-medium text-miru-white-1000 bg-miru-han-purple-1000 hover:bg-miru-han-purple-600 focus:outline-none rounded cursor-pointer" onClick={() => editProjectData ? handleEdit() : handleSubmit()}>{editProjectData ? " SAVE CHANGES" : "ADD PROJECT"}</button>
                : <button type="submit" className="tracking-widest h-10 w-full flex justify-center py-1 px-4 border border-transparent shadow-sm text-base font-sans font-medium text-miru-white-1000 bg-miru-gray-1000 focus:outline-none rounded cursor-pointer" disabled>{editProjectData ? "SAVE CHANGES" : "ADD PROJECT"}</button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AddEditProject.defaultProps = {
  projectData: {}
};

export default AddEditProject;
