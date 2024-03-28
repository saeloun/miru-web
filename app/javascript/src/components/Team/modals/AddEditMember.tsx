import React, { useState, useRef } from "react";

import { Formik, Form, FormikProps } from "formik";
import { useOutsideClick, useKeypress } from "helpers";
import { XIcon } from "miruIcons";
import { Button, Modal } from "StyledComponents";
import * as Yup from "yup";

import teamApi from "apis/team";
import CustomRadioButton from "common/CustomRadio";
import { InputErrors, InputField } from "common/FormikFields";
import { TeamModalType } from "constants/index";
import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";

import TeamForm from "./TeamForm";

const TeamMemberSchema = Yup.object().shape({
  firstName: Yup.string()
    .matches(/^[a-zA-Z]+$/, "First Name must contain only letters")
    .max(20, "Maximum 20 characters are allowed")
    .required("First Name cannot be blank"),
  lastName: Yup.string()
    .matches(/^[a-zA-Z]+$/, "Last Name must contain only letters")
    .max(20, "Maximum 20 characters are allowed")
    .required("Last Name cannot be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
});

const getInitialvalues = user => ({
  id: user?.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role ? user.role : "employee",
});

interface FormValues {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}
interface Props {
  user: any;
  isEdit: boolean;
}

const EditClient = ({ user = {}, isEdit = false }: Props) => {
  const [apiError, setApiError] = useState<string>(""); // eslint-disable-line
  const { setModalState, modal, setRefreshList } = useList();
  const wrapperRef = useRef();
  const { isDesktop } = useUserContext();

  const handleSubmit = async values => {
    const { id, firstName, lastName, email, role } = values;
    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      role,
    };

    if (isEdit) payload["id"] = id;

    if (!user.isTeamMember) payload["recipient_email"] = email;

    try {
      if (isEdit) {
        if (user.isTeamMember) {
          await teamApi.updateTeamMember(user.id, payload);
          setRefreshList(true);
        } else {
          await teamApi.updateInvitedMember(user.id, payload);
          setRefreshList(true);
        }
      } else {
        await teamApi.inviteMember(payload);
        setRefreshList(true);
      }
      setModalState("");
      setRefreshList(true);
    } catch (err) {
      setApiError(err.message);
    }
  };

  const getLabel = () => {
    if (isEdit) {
      if (user.isTeamMember) {
        return "Edit User Details";
      }

      return "Edit Invitation";
    }

    return "Create New User";
  };

  const handleCloseModal = () => {
    setModalState(TeamModalType.NONE);
  };

  useOutsideClick(wrapperRef, handleCloseModal);

  useKeypress("Escape", handleCloseModal);

  if (isDesktop) {
    return (
      <Modal
        customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
        isOpen={modal == "addEdit"}
        onClose={handleCloseModal}
      >
        <div className="flex items-center justify-between">
          <h6 className="text-base font-extrabold">{getLabel()}</h6>
          <Button style="ternary" onClick={handleCloseModal}>
            <XIcon
              className="text-miru-dark-purple-1000"
              size={16}
              weight="bold"
            />
          </Button>
        </div>
        <Formik
          initialValues={getInitialvalues(user)}
          validationSchema={TeamMemberSchema}
          onSubmit={handleSubmit}
        >
          {(props: FormikProps<FormValues>) => {
            const {
              touched,
              errors,
              isValid,
              dirty,
              values,
              setFieldError,
              setFieldValue,
            } = props;

            return (
              <Form>
                <div className="mt-4 flex gap-4">
                  <div className="field w-1/2">
                    <InputField
                      hasError={errors.firstName && touched.firstName}
                      id="firstName"
                      label="First Name"
                      name="firstName"
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                      type="text"
                    />
                    <InputErrors
                      fieldErrors={errors.firstName}
                      fieldTouched={touched.firstName}
                    />
                  </div>
                  <div className="field w-1/2">
                    <InputField
                      hasError={errors.lastName && touched.lastName}
                      id="lastName"
                      label="Last Name"
                      name="lastName"
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                      type="text"
                    />
                    <InputErrors
                      fieldErrors={errors.lastName}
                      fieldTouched={touched.lastName}
                    />
                  </div>
                </div>
                <div className="field">
                  <InputField
                    autoFocus
                    hasError={errors.email && touched.email}
                    id="email"
                    label="Email"
                    name="email"
                    setFieldError={setFieldError}
                    setFieldValue={setFieldValue}
                  />
                  <InputErrors
                    fieldErrors={errors.email}
                    fieldTouched={touched.email}
                  />
                </div>
                <div className="field">
                  <label className="text-xs font-normal text-miru-dark-purple-1000">
                    Role
                  </label>
                  <div className="mt-2 flex items-center gap-6">
                    <CustomRadioButton
                      classNameLabel="font-medium text-sm text-miru-dark-purple-1000"
                      classNameWrapper="py-2 pr-2 rounded"
                      defaultCheck={values.role == "admin"}
                      groupName="role"
                      id="admin"
                      key="admin"
                      label="Admin"
                      value={values.role}
                      handleOnChange={() => {
                        setFieldValue("role", "admin", true);
                      }}
                    />
                    <CustomRadioButton
                      classNameLabel="font-medium text-sm text-miru-dark-purple-1000"
                      classNameWrapper="py-2 pr-2 rounded"
                      defaultCheck={values.role == "employee"}
                      groupName="role"
                      id="employee"
                      key="employee"
                      label="Employee"
                      value={values.role}
                      handleOnChange={() => {
                        setFieldValue("role", "employee", true);
                      }}
                    />
                    <CustomRadioButton
                      classNameLabel="font-medium text-sm text-miru-dark-purple-1000"
                      classNameWrapper="py-2 pr-2 rounded"
                      defaultCheck={values.role == "book_keeper"}
                      groupName="role"
                      id="book_keeper"
                      key="book_keeper"
                      label="Bookkeeper"
                      value={values.role}
                      handleOnChange={() => {
                        setFieldValue("role", "book_keeper", true);
                      }}
                    />
                    <CustomRadioButton
                      classNameLabel="font-medium text-sm text-miru-dark-purple-1000"
                      classNameWrapper="py-2 pr-2 rounded"
                      defaultCheck={values.role == "client"}
                      groupName="role"
                      id="client"
                      key="client"
                      label="Client"
                      value={values.role}
                      handleOnChange={() => {
                        setFieldValue("role", "client", true);
                      }}
                    />
                  </div>
                </div>
                <div className="actions mt-6">
                  <Button
                    disabled={!(dirty && isValid)}
                    type="submit"
                    className={
                      !isValid || !dirty
                        ? "focus:outline-none flex h-10 w-full justify-center rounded border border-transparent bg-miru-gray-1000 text-base font-medium tracking-widest text-miru-white-1000 shadow-sm"
                        : "form__input_submit"
                    }
                  >
                    {isEdit ? "SAVE CHANGES" : "SEND INVITE"}
                  </Button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </Modal>
    );
  }

  return (
    <TeamForm
      TeamMemberSchema={TeamMemberSchema}
      getLabel={getLabel}
      handleCloseModal={handleCloseModal}
      handleSubmit={handleSubmit}
      initialValues={getInitialvalues(user)}
      isEdit={isEdit}
    />
  );
};

export default EditClient;
