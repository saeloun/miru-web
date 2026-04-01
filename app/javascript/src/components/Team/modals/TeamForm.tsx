import React from "react";

import CustomRadioButton from "common/CustomRadio";
import { InputField, InputErrors } from "common/FormikFields";
import { Formik, Form, FormikProps } from "formik";
import { i18n } from "../../../i18n";
import { XIcon } from "miruIcons";
import { Button } from "StyledComponents";

const TeamForm = ({
  initialValues,
  TeamMemberSchema,
  handleSubmit,
  isEdit,
  getLabel,
  handleCloseModal,
}) => {
  interface FormValues {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between bg-primary p-3 text-white">
        <span className="w-full pl-6 text-center text-base font-medium leading-5 text-white">
          {getLabel()}
        </span>
        <XIcon className="text-white" size={16} onClick={handleCloseModal} />
      </div>
      <Formik
        initialValues={initialValues}
        validationSchema={TeamMemberSchema}
        onSubmit={handleSubmit}
      >
        {(props: FormikProps<FormValues>) => {
          const {
            touched,
            errors,
            isValid,
            dirty,
            setFieldError,
            setFieldValue,
            values,
          } = props;

          return (
            <Form className="flex flex-1 flex-col justify-between p-4">
              <div>
                <InputField
                  autoComplete="off"
                  id="firstName"
                  inputBoxClassName="border focus:border-primary"
                  label={i18n.t("contacts.firstName")}
                  name="firstName"
                  setFieldError={setFieldError}
                  setFieldValue={setFieldValue}
                  type="input"
                />
                <InputErrors
                  fieldErrors={errors.firstName}
                  fieldTouched={touched.firstName}
                />
                <InputField
                  autoComplete="off"
                  id="lastName"
                  inputBoxClassName="border focus:border-primary"
                  label={i18n.t("contacts.lastName")}
                  name="lastName"
                  setFieldError={setFieldError}
                  setFieldValue={setFieldValue}
                  type="input"
                />
                <InputErrors
                  fieldErrors={errors.lastName}
                  fieldTouched={touched.lastName}
                />
                <InputField
                  autoComplete="off"
                  id="email"
                  label={i18n.t("email")}
                  name="email"
                  readOnly={false}
                  setFieldError={setFieldError}
                  setFieldValue={setFieldValue}
                  type="email"
                  inputBoxClassName={`border ${
                    errors.email && touched.email
                      ? "focus:border-red-600"
                      : "focus:border-primary"
                  }`}
                />
                <InputErrors
                  fieldErrors={errors.email}
                  fieldTouched={touched.email}
                />
                <div>
                  <span className="text-xs font-normal text-foreground">
                    {i18n.t("role")}
                  </span>
                  <div className="flex">
                    <div>
                      <CustomRadioButton
                        classNameLabel="font-medium text-sm leading-5 text-foreground"
                        classNameWrapper="py-3"
                        defaultCheck={values.role == "admin"}
                        groupName="roles"
                        id="Admin"
                        key="Admin"
                        label={i18n.t("team.admin")}
                        value={values.role == "admin" ? "admin" : ""}
                        handleOnChange={() => {
                          setFieldValue("role", "admin", true);
                        }}
                      />
                      <CustomRadioButton
                        classNameLabel="font-medium text-sm leading-5 text-foreground"
                        classNameWrapper="py-3"
                        defaultCheck={values.role == "employee"}
                        groupName="roles"
                        id="Employee"
                        key="Employee"
                        label={i18n.t("team.employee")}
                        value={values.role == "employee" ? "employee" : ""}
                        handleOnChange={() => {
                          setFieldValue("role", "employee", true);
                        }}
                      />
                    </div>
                    <div>
                      <CustomRadioButton
                        classNameLabel="font-medium text-sm leading-5 text-foreground"
                        classNameWrapper="ml-10 px-5 py-3"
                        defaultCheck={values.role == "book_keeper"}
                        groupName="roles"
                        id="Book Keeper"
                        key="Book Keeper"
                        label={i18n.t("team.bookkeeper")}
                        handleOnChange={() => {
                          setFieldValue("role", "book_keeper", true);
                        }}
                        value={
                          values.role == "book_keeper" ? "book_keeper" : ""
                        }
                      />
                      <CustomRadioButton
                        classNameLabel="font-medium text-sm leading-5 text-foreground"
                        classNameWrapper="ml-10 px-5 py-3"
                        defaultCheck={values.role == "client"}
                        groupName="roles"
                        id="Client"
                        key="Client"
                        label={i18n.t("team.clientRole")}
                        value={values.role == "client" ? "client" : ""}
                        handleOnChange={() => {
                          setFieldValue("role", "client", true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <Button
                disabled={!(dirty && isValid)}
                style="primary"
                className={`w-full p-2 text-center text-base font-bold ${
                  !isValid || (!dirty && "bg-secondary")
                }`}
              >
                {isEdit ? i18n.t("save") : i18n.t("team.inviteMember")}
              </Button>
            </Form>
          );
        }}
      </Formik>
      <div className="footer" />
    </div>
  );
};

export default TeamForm;
