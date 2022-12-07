import React from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import { XIcon } from "miruIcons";
import * as Yup from "yup";

import clientApi from "apis/clients";
import Toastr from "common/Toastr";

const newClientSchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
  phone: Yup.number().typeError("Invalid phone number"),
  address: Yup.string().required("Address cannot be blank"),
});

const initialValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

interface FormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const EditClient = ({ setnewClient, clientData, setClientData }) => {
  const handleSubmit = async values => {
    const res = await clientApi.create(values);
    setClientData([...clientData, { ...res.data, minutes: 0 }]);
    setnewClient(false);
    Toastr.success("Client added successfully");
  };

  return (
    <div className="flex items-center justify-center px-4">
      <div
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-10 flex items-start justify-center overflow-auto"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)",
        }}
      >
        <div className="relative h-full w-full px-4 md:flex md:items-center md:justify-center">
          <div className="modal-width transform rounded-lg bg-white px-6 pb-6 shadow-xl transition-all sm:max-w-md sm:align-middle">
            <div className="mt-6 flex items-center justify-between">
              <h6
                className="text-base font-extrabold"
                data-cy="add-client-heading"
              >
                Add New Client
              </h6>
              <button
                type="button"
                onClick={() => {
                  setnewClient(false);
                }}
              >
                <XIcon color="#CDD6DF" size={16} weight="bold" />
              </button>
            </div>
            <Formik
              initialValues={initialValues}
              validationSchema={newClientSchema}
              onSubmit={handleSubmit}
            >
              {(props: FormikProps<FormValues>) => {
                const { touched, errors } = props;

                return (
                  <Form>
                    <div className="mt-4">
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Name</label>
                          <div className="block text-xs tracking-wider text-red-600">
                            {errors.name && touched.name && (
                              <div>{errors.name}</div>
                            )}
                          </div>
                        </div>
                        <div className="mt-1">
                          <Field
                            data-cy="name-input"
                            name="name"
                            className={`form__input ${
                              errors.name &&
                              touched.name &&
                              "border-red-600 focus:border-red-600 focus:ring-red-600"
                            } `}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Email</label>
                          <div className="block text-xs tracking-wider text-red-600">
                            {errors.email && touched.email && (
                              <div>{errors.email}</div>
                            )}
                          </div>
                        </div>
                        <div className="mt-1">
                          <Field
                            data-cy="email-input"
                            name="email"
                            className={`form__input ${
                              errors.email &&
                              touched.email &&
                              "border-red-600 focus:border-red-600 focus:ring-red-600"
                            } `}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Phone number</label>
                          <div className="block text-xs tracking-wider text-red-600">
                            {errors.phone && touched.phone && (
                              <div>{errors.phone}</div>
                            )}
                          </div>
                        </div>
                        <div className="mt-1">
                          <Field
                            data-cy="phone-number-input"
                            name="phone"
                            className={`form__input ${
                              errors.phone &&
                              touched.phone &&
                              "border-red-600 focus:border-red-600 focus:ring-red-600"
                            } `}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Address</label>
                          <div className="block text-xs tracking-wider text-red-600">
                            {errors.address && touched.address && (
                              <div>{errors.address}</div>
                            )}
                          </div>
                        </div>
                        <div className="mt-1">
                          <Field
                            as="textarea"
                            data-cy="address-input"
                            name="address"
                            className={`form__input h-12 p-2 ${
                              errors.address &&
                              touched.address &&
                              "border-red-600 focus:border-red-600 focus:ring-red-600"
                            } `}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="actions mt-4">
                      <input
                        className="form__input_submit"
                        data-cy="submit-button"
                        name="commit"
                        type="submit"
                        value="SAVE CHANGES"
                      />
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClient;
