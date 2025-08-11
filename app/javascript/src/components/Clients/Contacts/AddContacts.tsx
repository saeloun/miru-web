import React from "react";

import clientApi from "apis/clients";
import { InputField, InputErrors } from "common/FormikFields";
import { Formik, Form, FormikProps } from "formik";
import { XIcon } from "miruIcons";
import { Button, Modal } from "StyledComponents";
import * as Yup from "yup";

const contactSchema = Yup.object().shape({
  firstName: Yup.string()
    .matches(/^[a-zA-Z]+$/, "First Name must contain only letters")
    .max(20, "Maximum 20 characters are allowed")
    .required("First Name cannot be blank"),
  lastName: Yup.string()
    .matches(/^[a-zA-Z]+$/, "Last Name must contain only letters")
    .max(20, "Maximum 20 characters are allowed"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
});

const AddContacts = ({
  client,
  fetchDetails,
  setShowContactModal,
  showContactModal,
}) => {
  interface FormValues {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
  }

  const handleSubmit = async values => {
    const { firstName, lastName, email } = values;
    const payload = { firstName, lastName, email };
    await clientApi.addClientContact(client.id, payload);
    setShowContactModal(false);
    fetchDetails();
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showContactModal}
      onClose={() => setShowContactModal(false)}
    >
      <div className="modal__position">
        <h6 className="modal__title"> Add Contact </h6>
        <div className="modal__close">
          <button
            className="modal__button"
            onClick={() => {
              setShowContactModal(false);
            }}
          >
            <XIcon color="#CDD6DF" size={15} />
          </button>
        </div>
      </div>
      <Formik
        initialValues={{ id: "", firstName: "", lastName: "", email: "" }}
        validationSchema={contactSchema}
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
          } = props;

          return (
            <Form className="flex flex-1 flex-col justify-between p-4">
              <div>
                <InputField
                  autoComplete="off"
                  hasError={errors.firstName && touched.firstName}
                  id="firstName"
                  inputBoxClassName="border focus:border-miru-han-purple-1000"
                  label="First Name"
                  marginBottom={errors.firstName && "mb-0"}
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
                  hasError={errors.lastName && touched.lastName}
                  id="lastName"
                  inputBoxClassName="border focus:border-miru-han-purple-1000"
                  label="Last Name"
                  marginBottom={errors.lastName && "mb-0"}
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
                  hasError={errors.email && touched.email}
                  id="email"
                  label="Email"
                  marginBottom={errors.email && "mb-0"}
                  name="email"
                  readOnly={false}
                  setFieldError={setFieldError}
                  setFieldValue={setFieldValue}
                  type="email"
                  inputBoxClassName={`border ${
                    errors.email && touched.email
                      ? "focus:border-red-600"
                      : "focus:border-miru-han-purple-1000"
                  }`}
                />
                <InputErrors
                  fieldErrors={errors.email}
                  fieldTouched={touched.email}
                />
              </div>
              <Button
                disabled={!(dirty && isValid)}
                style="primary"
                type="submit"
                className={`w-full p-2 text-center text-base font-bold ${
                  !isValid || (!dirty && "bg-miru-gray-400")
                }`}
              >
                Add Contact
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Modal>
  );
};

export default AddContacts;
