/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState } from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import { X } from "phosphor-react";
import * as Yup from "yup";

import clientApi from "apis/clients";

const newClientSchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be blank"),
  email: Yup.string().email("Invalid email ID").required("Email ID cannot be blank"),
  phone: Yup.number().typeError("Invalid phone number"),
  address: Yup.string().required("Address cannot be blank")
});

const getInitialvalues = (client) => ({
  name: client.name,
  email: client.email,
  phone: client.phone,
  address: client.address,
  minutes: client.minutes,
  client_logo: client.client_logo
});

const deleteImage = require("../../../../../assets/images/delete.svg");
const editButton = require("../../../../../assets/images/edit_image_button.svg");

export interface IEditClient {
  setShowEditDialog: any;
  client: any;
  clientLogoUrl: any;
  setClientLogoUrl: any;
  clientLogo: any;
  setClientLogo: any;
}

interface FormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  client_logo: any;
}

const EditClient = ({ setShowEditDialog, client, clientLogoUrl, setClientLogoUrl, clientLogo, setClientLogo }: IEditClient) => {

  const [apiError, setApiError] = useState<string>("");

  const handleSubmit = async values => {
    const formData = new FormData();
    formData.append("client[name]", values.name);
    formData.append("client[email]", values.email);
    formData.append("client[phone]", values.phone);
    formData.append("client[address]", values.address);
    if (clientLogoUrl) formData.append("client[client_logo]", clientLogo);

    await clientApi.update(client.id, formData).then(() => {
      setShowEditDialog(false);
      document.location.reload();
    }).catch((e) => {
      setApiError(e.message);
    });
  };

  const onLogoChange = () => {
    setClientLogo("");
    setClientLogoUrl("");
  };

  return (
    <div className="px-4 flex items-center justify-center">
      <div
        className="overflow-auto fixed top-0 left-0 right-0 bottom-0 inset-0 z-10 flex items-start justify-center"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)"
        }}
      >
        <div className="relative px-4 h-full w-full md:flex md:items-center md:justify-center">
          <div className="rounded-lg px-6 pb-6 bg-white shadow-xl transform transition-all sm:align-middle sm:max-w-md modal-width">
            <div className="flex justify-between items-center mt-6">
              <h6 className="text-base font-extrabold">Edit Client</h6>
              <button type="button" onClick={() => { setShowEditDialog(false); }}>
                <X size={16} color="#CDD6DF" weight="bold" />
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
                      <div className="mt-4">
                        <div className="field">
                          <div className="mt-1">
                            {
                              client.client_logo === "" ? (
                                <div className="flex flex-row">
                                  <div className="w-20 h-20">
                                    <label htmlFor="file-input" className="flex justify-center items-center w-full h-full cursor-pointer">
                                      <span className="rounded-full bg-miru-han-purple-1000 w-22 text-lg text-center leading-10 text-gray-50">
                                        { client.name.split(" ").map(name => name[0]).join("").toUpperCase() }
                                      </span>
                                    </label>
                                  </div>
                                  <input
                                    id="file-input"
                                    type="file"
                                    name="client_logo"
                                    className='hidden'
                                    onChange={event => {
                                      const file = event.target.files[0];
                                      setClientLogoUrl(URL.createObjectURL(file));
                                      setClientLogo(file);
                                    }} />
                                  <label htmlFor="file_input">
                                    <img src={editButton} className="rounded-full mt-5 cursor-pointer" style={{ "minWidth": "40px" }} alt="edit" />
                                  </label>
                                  <input id="file_input" type="file" name="myImage" className='hidden' onChange={onLogoChange}></input>
                                  <button type="button">
                                    <img
                                      src={deleteImage}
                                      alt="delete"
                                      style={{ "minWidth": "20px" }}
                                    />
                                  </button>
                                </div>
                              ) : (
                                <div className="mt-2 flex flex-row">
                                  <div className="w-20 h-20">
                                    <img src={clientLogoUrl || client.client_logo} alt="client logo" className="rounded-full min-w-full h-full" />
                                  </div>
                                  <input
                                    id="file_input"
                                    type='file'
                                    className="hidden"
                                    onChange={event => {
                                      const file = event.target.files[0];
                                      setClientLogoUrl(URL.createObjectURL(file));
                                      setClientLogo(file);
                                    }}
                                    name='client_logo'
                                  />
                                  <label htmlFor="file_input">
                                    <img src={editButton} className="rounded-full mt-5 cursor-pointer" style={{ "minWidth": "40px" }} alt="edit" />
                                  </label>
                                  <input id="file_input" type="file" name="myImage" className='hidden' onChange={onLogoChange}></input>
                                  <button type="button">
                                    <img
                                      src={deleteImage}
                                      alt="delete"
                                      style={{ "minWidth": "20px" }}
                                    />
                                  </button>
                                </div>
                              )
                            }
                          </div>
                        </div>
                      </div>
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Name</label>
                          <div className="tracking-wider block text-xs text-red-600">
                            {errors.name && touched.name &&
                              <div>{errors.name}</div>
                            }
                          </div>
                        </div>
                        <div className="mt-1">
                          <Field className={`form__input ${errors.name && touched.name && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="name" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Email</label>
                          <div className="tracking-wider block text-xs text-red-600">
                            {errors.email && touched.email &&
                              <div>{errors.email}</div>
                            }
                          </div>
                        </div>
                        <div className="mt-1">
                          <Field className={`form__input ${errors.email && touched.email && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="email" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Phone number</label>
                          <div className="tracking-wider block text-xs text-red-600">
                            {errors.phone && touched.phone &&
                              <div>{errors.phone}</div>
                            }
                          </div>
                        </div>
                        <div className="mt-1">
                          <Field className={`form__input ${errors.phone && touched.phone && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="phone" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Address</label>
                          <div className="tracking-wider block text-xs text-red-600">
                            {errors.address && touched.address &&
                              <div>{errors.address}</div>
                            }
                          </div>
                        </div>
                        <div className="mt-1">
                          <Field className={`form__input ${errors.address && touched.address && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="address" />
                        </div>
                      </div>
                    </div>
                    <p className="tracking-wider mt-3 block text-xs text-red-600">{apiError}</p>
                    <div className="actions mt-4">
                      <input
                        type="submit"
                        name="commit"
                        value="SAVE CHANGES"
                        className="form__input_submit"
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
