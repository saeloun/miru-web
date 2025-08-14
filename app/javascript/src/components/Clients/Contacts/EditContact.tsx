import React from "react";

import clientMembersApi from "apis/clientMembers";
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
    .max(20, "Maximum 20 characters are allowed")
    .required("Last Name cannot be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
});

const EditContact = ({
  contact,
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
    const { firstName, lastName } = values;

    const payload = {
      first_name: firstName,
      last_name: lastName,
    };

    await clientMembersApi.update(contact.contactId, client.id, payload);
    fetchDetails();
    setShowContactModal(false);
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showContactModal}
      onClose={() => setShowContactModal(false)}
    >
      <div className="modal__position">
        <h6 className="modal__title"> Edit Contact </h6>
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
        validationSchema={contactSchema}
        initialValues={{
          id: "",
          firstName: contact?.firstName || "",
          lastName: contact?.lastName || "",
          email: contact?.email || "",
        }}
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
                  id="firstName"
                  inputBoxClassName="border focus:border-miru-han-purple-1000"
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
                  inputBoxClassName="border focus:border-miru-han-purple-1000"
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
                  disabled
                  readOnly
                  autoComplete="off"
                  id="email"
                  label="Email"
                  name="email"
                  setFieldError={setFieldError}
                  setFieldValue={setFieldValue}
                  type="email"
                  inputBoxClassName={`border cursor-not-allowed ${
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
                Update Contact
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Modal>
  );
};

export default EditContact;
