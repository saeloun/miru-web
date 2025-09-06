import React, { useEffect, useState } from "react";

import { projectApi } from "apis/api";
import Logger from "js-logger";
import { XIcon } from "miruIcons";
import { Modal } from "StyledComponents";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";

const AddEditProject = ({
  setEditProjectData,
  editProjectData,
  setShowProjectModal,
  showProjectModal,
  projectData = {},
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
      <div className="modal__form flex-col space-y-4">
        {/* Client Selection */}
        <div className="space-y-2">
          <Label htmlFor="client">
            Client <span className="text-red-500">*</span>
          </Label>
          <Select
            value={client.toString()}
            onValueChange={value => setClient(Number(value))}
          >
            <SelectTrigger id="client">
              <SelectValue placeholder="Select Client" />
            </SelectTrigger>
            <SelectContent>
              {clientList &&
                clientList.map((clientItem, index) => (
                  <SelectItem key={index} value={clientItem["id"].toString()}>
                    {clientItem["name"]}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="project-name">
            Project Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="project-name"
            placeholder="Enter Project Name"
            type="text"
            value={projectName}
            onChange={event => setProjectName(event.target.value)}
          />
        </div>
        {/* Project Type */}
        <div className="space-y-2">
          <Label>Project Type</Label>
          <RadioGroup value={projectType} onValueChange={setProjectType}>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Billable" id="billable" />
                <Label htmlFor="billable">Billable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Non-Billable" id="non-billable" />
                <Label htmlFor="non-billable">Non-billable</Label>
              </div>
            </div>
          </RadioGroup>
        </div>
        {/* Submit Button */}
        <div className="pt-4">
          <Button
            disabled={!isFormFilled}
            type="button"
            className="w-full"
            onClick={handleSubmit}
          >
            {isEdit ? "Save Changes" : "Add Project"}
          </Button>
        </div>
      </div>
    </Modal>
  ) : null;
};

export default AddEditProject;
