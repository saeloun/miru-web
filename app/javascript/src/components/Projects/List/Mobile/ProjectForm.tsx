import React, { useState, useEffect } from "react";

import projectApi from "apis/projects";
import CustomRadioButton from "common/CustomRadio";
import { InputField, InputErrors } from "common/FormikFields";
import { Formik, Form, FormikProps } from "formik";
import { useDebounce } from "helpers";
import { XIcon, SearchIcon } from "miruIcons";
import { Button, MobileMoreOptions } from "StyledComponents";

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
      data.project.billable !== undefined && data.project.billable !== null
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
      data.project.billable !== undefined && data.project.billable !== null
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

      if (newClientList.length > 0) {
        setFilteredClientList(newClientList);
      } else {
        setFilteredClientList([]);
      }
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
      <div className="flex items-center justify-between bg-miru-han-purple-1000 p-3 text-white">
        <span className="w-full pl-6 text-center text-base font-medium leading-5 text-white">
          {editProjectData?.id ? "Edit Project Details" : "Add New Project"}
        </span>
        <XIcon
          className="text-white"
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
                  inputBoxClassName="border focus:border-miru-han-purple-1000"
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
                {showClientList && (
                  <MobileMoreOptions
                    className="flex h-1/2 flex-col"
                    setVisibilty={setShowClientList}
                    visibilty={showClientList}
                  >
                    <div className="relative mt-2 flex w-full items-center">
                      <input
                        placeholder="Search"
                        type="text"
                        value={clientName}
                        className="focus:outline-none w-full rounded bg-miru-gray-100 p-2
            text-sm font-medium focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
                        onChange={e => {
                          setClientName(e.target.value);
                        }}
                      />
                      {clientName ? (
                        <XIcon
                          className="absolute right-2"
                          color="#1D1A31"
                          size={16}
                          onClick={() => setClientName("")}
                        />
                      ) : (
                        <SearchIcon
                          className="absolute right-2"
                          color="#1D1A31"
                          size={16}
                        />
                      )}
                    </div>
                    <div className="flex flex-auto flex-col overflow-y-scroll">
                      {filteredClientList ? (
                        filteredClientList.map(clientItem => (
                          <li
                            className="flex items-center px-2 pt-3 text-sm leading-5 text-miru-dark-purple-1000 hover:bg-miru-gray-100"
                            key={clientItem?.id}
                            onClick={() => {
                              setFieldValue("client", clientItem.name, true);
                              setClient(clientItem);
                              setShowClientList(false);
                              document.getElementById("project").focus();
                            }}
                          >
                            {clientItem.name}
                          </li>
                        ))
                      ) : (
                        <span className="mt-4">No clients present</span>
                      )}
                    </div>
                  </MobileMoreOptions>
                )}
                <InputField
                  autoComplete="off"
                  id="project"
                  inputBoxClassName="border focus:border-miru-han-purple-1000"
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
                  <span className="text-base font-normal text-miru-dark-purple-1000">
                    Project Type
                  </span>
                  <div className="flex">
                    <CustomRadioButton
                      classNameLabel="font-medium text-base leading-5 text-miru-dark-purple-1000"
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
                      classNameLabel="font-medium text-base leading-5 text-miru-dark-purple-1000"
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
                style="primary"
                className={`w-full p-2 text-center text-base font-bold ${
                  isSubmitDisabled && "bg-miru-gray-400"
                }`}
                onClick={handleSubmit}
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
