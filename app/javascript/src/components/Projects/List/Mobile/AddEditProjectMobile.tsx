import React, { useState, useEffect } from "react";

import { Formik, Form, FormikProps } from "formik";
import Logger from "js-logger";
import { XIcon, SearchIcon } from "miruIcons";
import { Button, MobileMoreOptions } from "StyledComponents";

import projectApi from "apis/projects";
import CustomRadioButton from "common/CustomRadio";
import { InputField, InputErrors } from "common/FormikFields";

const AddEditProjectMobile = ({
  editProjectData,
  setEditProjectData,
  setShowProjectModal,
}) => {
  const [client, setClient] = useState<object>({});
  const [clientName, setClientName] = useState<string>("");
  const [clientList, setClientList] = useState<any[]>([]);
  const [showClientList, setShowClientList] = useState<boolean>(false);

  const projectId =
    (editProjectData && editProjectData["id"]) ||
    Number(window.location.pathname.split("/").at(-1));

  const isEdit = !!projectId;

  interface FormValues {
    client: string;
    project: string;
    isBillable: boolean;
  }

  const initialValues = {
    client: editProjectData.clientName,
    project: editProjectData.name,
    isBillable: editProjectData.isBillable || editProjectData.is_billable,
  };

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

  const createProject = async values => {
    await projectApi.create({
      project: {
        client_id: client["id"],
        name: values.project,
        billable: values.isBillable,
      },
    });
    setEditProjectData("");
    window.location.reload();
    setShowProjectModal(false);
  };

  const editProject = async values => {
    await projectApi.update(editProjectData.id, {
      project: {
        client_id: client["id"],
        name: values.project,
        billable: values.isBillable,
      },
    });
    setEditProjectData("");
    setShowProjectModal(false);
    window.location.reload();
  };

  const handleSubmit = values => {
    if (isEdit) {
      editProject(values);
    } else {
      createProject(values);
    }
  };

  useEffect(() => {
    getClientList();
    if (isEdit) getProject();
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between bg-miru-han-purple-1000 p-3 text-white">
        <span className="w-full pl-6 text-center text-base font-medium leading-5 text-white">
          {editProjectData?.id ? "Edit Project Details" : "Add New Project"}
        </span>
        <XIcon
          className="text-white"
          size={16}
          onClick={() => {
            setShowProjectModal(false);
          }}
        />
      </div>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {(props: FormikProps<FormValues>) => {
          const { touched, values, errors, setFieldValue, setFieldError } =
            props;

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
                          className="absolute right-8"
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
                      {clientList.map(clientItem => (
                        <li
                          className="flex items-center px-2 pt-3 text-sm leading-5 text-miru-dark-purple-1000 hover:bg-miru-gray-100"
                          key={clientItem?.id}
                          onClick={() => {
                            setFieldValue("client", clientItem.name, true);
                            setClient(clientItem);
                            setShowClientList(false);
                          }}
                        >
                          {clientItem.name}
                        </li>
                      ))}
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
                  <span className="text-xs font-normal text-miru-dark-purple-1000">
                    Project Type
                  </span>
                  <div className="flex">
                    <CustomRadioButton
                      classNameLabel="font-medium text-sm leading-5 text-miru-dark-purple-1000"
                      classNameWrapper="py-3"
                      defaultCheck={values.isBillable}
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
                      classNameLabel="font-medium text-sm leading-5 text-miru-dark-purple-1000"
                      classNameWrapper="px-5 py-3"
                      defaultCheck={!values.isBillable}
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
                className="w-full p-2 text-center text-base font-bold"
                style="primary"
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

export default AddEditProjectMobile;
