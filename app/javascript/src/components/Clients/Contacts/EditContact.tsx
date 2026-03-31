import React from "react";

import { clientMembersApi } from "apis/api";
import { InputField, InputErrors } from "common/FormikFields";
import { Formik, Form, FormikProps } from "formik";
import { XIcon } from "miruIcons";
import { Button, Modal } from "StyledComponents";
import * as Yup from "yup";
import { i18n } from "../../../i18n";

const contactSchema = Yup.object().shape({
  firstName: Yup.string()
    .matches(/^[a-zA-Z]+$/, i18n.t("contacts.firstNameOnlyLetters"))
    .max(20, i18n.t("contacts.maxCharacters"))
    .required(i18n.t("contacts.firstNameRequired")),
  lastName: Yup.string()
    .matches(/^[a-zA-Z]+$/, i18n.t("contacts.lastNameOnlyLetters"))
    .max(20, i18n.t("contacts.maxCharacters"))
    .required(i18n.t("contacts.lastNameRequired")),
  email: Yup.string()
    .email(i18n.t("contacts.invalidEmailId"))
    .required(i18n.t("contacts.emailRequired")),
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
        <h6 className="modal__title"> {i18n.t("contacts.editContact")} </h6>
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
                  disabled
                  readOnly
                  autoComplete="off"
                  id="email"
                  label={i18n.t("email")}
                  name="email"
                  setFieldError={setFieldError}
                  setFieldValue={setFieldValue}
                  type="email"
                  inputBoxClassName={`border cursor-not-allowed ${
                    errors.email && touched.email
                      ? "focus:border-red-600"
                      : "focus:border-primary"
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
                  !isValid || (!dirty && "bg-secondary")
                }`}
              >
                {i18n.t("contacts.updateContact")}
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Modal>
  );
};

export default EditContact;
