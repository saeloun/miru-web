import React, { useState, useEffect } from "react";

import { Formik, Form, FormikProps } from "formik";
import { useDebounce } from "helpers";
import { MagnifyingGlass, X } from "phosphor-react";

import { projectApi } from "apis/api";
import CustomRadioButton from "common/CustomRadio";
import { InputField, InputErrors } from "common/FormikFields";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";

const ProjectForm = ({
  editProjectData,
  setEditProjectData,
  setShowProjectModal,
  fetchProjects,
}) => {
  const [client, setClient] = useState<object>({});
  const [clientName, setClientName] = useState<string>("");
  const [clientList, setClientList] = useState<any[]>([]);
  const [showClientList, setShowClientList] = useState<boolean>(false);
  const [filteredClientList, setFilteredClientList] = useState(clientList);
  const debouncedSearchQuery = useDebounce(clientName, 500);

  const projectId =
    (editProjectData && editProjectData["id"]) ||
    (window.location.pathname.includes("project") &&
      Number(window.location.pathname?.split("/").at(-1)));

  const isEdit = !!projectId;
  interface FormValues {
    client: string;
    project: string;
    isBillable: boolean;
  }

  const initialValues = {
    client: editProjectData?.clientName || editProjectData?.client?.name || "",
    project: editProjectData.name,
    isBillable:
      editProjectData.isBillable !== undefined
        ? editProjectData.isBillable
        : true,
  };

  const getClientList = async () => {
    const { data } = await projectApi.get();
    if (data.clients) {
      setClientList(data.clients);
    } else {
      setClientList([]);
    }
  };

  const getProject = async () => {
    if (!editProjectData.members) {
      const { data } = await projectApi.show(projectId);
      if (data.project_details) {
        setEditProjectData(data.project_details);
      }
    }
  };

  const createProject = async values => {
    const { project, isBillable } = values;
    const data = {
      project: {
        client_id: client["id"],
        name: project,
        billable: isBillable,
      },
    };
    if (
      data.project.client_id &&
      data.project.name &&
      data.project.billable !== undefined &&
      data.project.billable !== null
    ) {
      await projectApi.create(data);
      setEditProjectData("");
      setClient(null);
      setShowProjectModal(false);
      fetchProjects();
    }
  };

  const editProject = async values => {
    const { project, isBillable } = values;
    const data = {
      project: {
        client_id: client["id"],
        name: project,
        billable: isBillable,
      },
    };
    if (
      data.project.client_id &&
      data.project.name &&
      data.project.billable !== undefined &&
      data.project.billable !== null
    ) {
      await projectApi.update(editProjectData.id, data);
      setEditProjectData("");
      setClient(null);
      setShowProjectModal(false);
      fetchProjects();
    }
  };

  const handleSubmit = values => {
    if (isEdit) {
      editProject(values);
    } else {
      createProject(values);
    }
  };

  useEffect(() => {
    if (debouncedSearchQuery && filteredClientList.length > 0) {
      const newClientList = filteredClientList.filter(client =>
        client.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );

      newClientList.length > 0
        ? setFilteredClientList(newClientList)
        : setFilteredClientList([]);
    } else {
      setFilteredClientList(clientList);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => setFilteredClientList(clientList), [clientList]);

  useEffect(() => {
    if (editProjectData?.client?.id) {
      setClient(editProjectData.client);
    }
  }, [editProjectData]);

  useEffect(() => {
    getClientList();
    if (isEdit) getProject();
  }, []);

  return (
    <div className="z-50 flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
        <span className="w-full pl-6 text-center text-base font-semibold leading-5 text-foreground">
          {editProjectData?.id ? "Edit Project Details" : "Add New Project"}
        </span>
        <X
          className="cursor-pointer text-foreground"
          size={16}
          onClick={() => {
            setEditProjectData("");
            setShowProjectModal(false);
          }}
        />
      </div>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {(props: FormikProps<FormValues>) => {
          const { touched, values, errors, setFieldValue, setFieldError } =
            props;

          const isSubmitDisabled = !(values.client && values.project);

          return (
            <Form className="flex flex-1 flex-col justify-between p-4">
              <div>
                <InputField
                  readOnly
                  autoComplete="off"
                  id="client"
                  inputBoxClassName="border focus:border-primary"
                  label="Client"
                  name="client"
                  setFieldError={setFieldError}
                  setFieldValue={values.client}
                  type="input"
                  onClick={() => {
                    setShowClientList(true);
                  }}
                />
                <InputErrors
                  fieldErrors={errors.client}
                  fieldTouched={touched.client}
                />
                <Dialog open={showClientList} onOpenChange={setShowClientList}>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Select client</DialogTitle>
                    </DialogHeader>
                    <div className="relative mt-2 flex w-full items-center">
                      <input
                        placeholder="Search"
                        type="text"
                        value={clientName}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        onChange={e => {
                          setClientName(e.target.value);
                        }}
                      />
                      {clientName ? (
                        <X
                          className="absolute right-3 cursor-pointer text-muted-foreground"
                          size={16}
                          onClick={() => setClientName("")}
                        />
                      ) : (
                        <MagnifyingGlass
                          className="absolute right-3 text-muted-foreground"
                          size={16}
                        />
                      )}
                    </div>
                    <div className="mt-3 flex max-h-64 flex-auto flex-col overflow-y-auto rounded-xl border border-border bg-card">
                      {filteredClientList ? (
                        filteredClientList.map(clientItem => (
                          <button
                            className="flex items-center border-b border-border px-3 py-3 text-left text-sm leading-5 text-foreground transition hover:bg-muted last:border-b-0"
                            key={clientItem?.id}
                            type="button"
                            onClick={() => {
                              setFieldValue("client", clientItem.name, true);
                              setClient(clientItem);
                              setShowClientList(false);
                              document.getElementById("project").focus();
                            }}
                          >
                            {clientItem.name}
                          </button>
                        ))
                      ) : (
                        <span className="px-3 py-4 text-sm text-muted-foreground">
                          No clients present
                        </span>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <InputField
                  autoComplete="off"
                  id="project"
                  inputBoxClassName="border focus:border-primary"
                  label="Project Name"
                  name="project"
                  readOnly={false}
                  setFieldError={setFieldError}
                  setFieldValue={setFieldValue}
                  type="text"
                />
                <InputErrors
                  fieldErrors={errors.project}
                  fieldTouched={touched.project}
                />
                <div>
                  <span className="text-base font-normal text-foreground">
                    Project Type
                  </span>
                  <div className="flex">
                    <CustomRadioButton
                      classNameLabel="font-medium text-base leading-5 text-foreground"
                      classNameWrapper="py-3"
                      defaultCheck={values.isBillable == true}
                      groupName="projectType"
                      id="Billable"
                      key="Billable"
                      label="Billable"
                      value={values.isBillable ? "Billable" : "Non-Billable"}
                      handleOnChange={() => {
                        setFieldValue("isBillable", true, true);
                      }}
                    />
                    <CustomRadioButton
                      classNameLabel="font-medium text-base leading-5 text-foreground"
                      classNameWrapper="px-5 py-3"
                      defaultCheck={values.isBillable == false}
                      groupName="projectType"
                      id="Non-Billable"
                      key="Non-Billable"
                      label="Non-Billable"
                      value={values.isBillable ? "Billable" : "Non-Billable"}
                      handleOnChange={() => {
                        setFieldValue("isBillable", false, true);
                      }}
                    />
                  </div>
                </div>
              </div>
              <Button
                disabled={isSubmitDisabled}
                className="h-11 w-full text-base font-semibold"
                type="submit"
              >
                {isEdit ? "Edit Project" : "Add Project"}
              </Button>
            </Form>
          );
        }}
      </Formik>
      <div className="footer" />
    </div>
  );
};

export default ProjectForm;
