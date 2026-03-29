import React from "react";

import CustomRadioButton from "common/CustomRadio";
import { InputField, InputErrors } from "common/FormikFields";
import { Formik, Form, FormikProps } from "formik";
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
                  label="First Name"
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
                  label="Last Name"
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
                  label="Email"
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
                    Role
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
                        label="Admin"
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
                        label="Employee"
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
                        label="Bookkeeper"
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
                        label="Client"
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
                {isEdit ? "SAVE CHANGES" : "SEND INVITE"}
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
