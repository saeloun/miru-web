import React, { useState } from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import { XIcon } from "miruIcons";
import * as Yup from "yup";

import clientApi from "apis/clients";

const newClientSchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
  phone: Yup.number().typeError("Invalid phone number"),
  address: Yup.string().required("Address cannot be blank"),
});

const getInitialvalues = client => ({
  name: client.name,
  email: client.email,
  phone: client.phone,
  address: client.address,
  minutes: client.minutes,
});

interface IEditClient {
  setShowEditDialog: any;
  client: any;
}

interface FormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const EditClient = ({ setShowEditDialog, client }: IEditClient) => {
  const [apiError, setApiError] = useState<string>("");

  const handleSubmit = async values => {
    await clientApi
      .update(client.id, {
        client: {
          ...values,
        },
      })
      .then(() => {
        setShowEditDialog(false);
        document.location.reload();
      })
      .catch(e => {
        setApiError(e.message);
      });
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
              <h6 className="text-base font-extrabold">Edit Client</h6>
              <button
                type="button"
                onClick={() => {
                  setShowEditDialog(false);
                }}
              >
                <XIcon color="#CDD6DF" size={16} weight="bold" />
              </button>
            </div>
            <Formik
              initialValues={getInitialvalues(client)}
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
                            name="address"
                            className={`form__input ${
                              errors.address &&
                              touched.address &&
                              "border-red-600 focus:border-red-600 focus:ring-red-600"
                            } `}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 block text-xs tracking-wider text-red-600">
                      {apiError}
                    </p>
                    <div className="actions mt-4">
                      <input
                        className="form__input_submit"
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
