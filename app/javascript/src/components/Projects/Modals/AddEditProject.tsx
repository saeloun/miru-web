import React, { useEffect, useState } from "react";

import { projectApi } from "apis/api";
import Logger from "js-logger";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
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
      const uniqueClients = Array.from(
        new Map(
          (data.clients || []).map(clientItem => [clientItem.id, clientItem])
        ).values()
      );
      setClientList(uniqueClients);
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
    <Dialog
      open={showProjectModal}
      onOpenChange={open => {
        if (!open) {
          setEditProjectData("");
          setShowProjectModal(false);
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit project" : "Create project"}
          </DialogTitle>
          <DialogDescription>
            Choose the client, name the project, and set whether the work is
            billable.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-5">
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select
              value={client ? client.toString() : ""}
              onValueChange={value => setClient(Number(value))}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clientList &&
                  clientList.map(clientItem => (
                    <SelectItem
                      key={clientItem["id"]}
                      value={clientItem["id"].toString()}
                    >
                      {clientItem["name"]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              placeholder="Enter project name"
              type="text"
              value={projectName}
              onChange={event => setProjectName(event.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Project type</Label>
            <RadioGroup
              className="grid gap-3"
              value={projectType}
              onValueChange={setProjectType}
            >
              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                <div>
                  <Label className="text-sm font-medium" htmlFor="billable">
                    Billable
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Use this for client work that turns into invoices.
                  </p>
                </div>
                <RadioGroupItem value="Billable" id="billable" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                <div>
                  <Label className="text-sm font-medium" htmlFor="non-billable">
                    Non-billable
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Use this for internal work, admin tasks, or research.
                  </p>
                </div>
                <RadioGroupItem value="Non-Billable" id="non-billable" />
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditProjectData("");
                setShowProjectModal(false);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!isFormFilled}
              type="button"
              onClick={handleSubmit}
            >
              {isEdit ? "Save changes" : "Create project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ) : null;
};

export default AddEditProject;
