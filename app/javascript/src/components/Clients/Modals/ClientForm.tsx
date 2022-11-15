/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import * as Yup from "yup";

const deleteImage = require("../../../../../assets/images/delete.svg");
const editButton = require("../../../../../assets/images/edit_image_button.svg");
const img = require("../../../../../assets/images/plus_icon.svg");

interface IClientForm {
  clientLogoUrl: string;
  handleSubmit: any;
  handleDeleteLogo: any;
  setClientLogoUrl: any;
  setClientLogo: any;
  formType?: string;
  clientData?: any;
  apiError?: string;
}

interface FormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  client_logo: any;
}

const clientSchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
  phone: Yup.number().typeError("Invalid phone number"),
  address: Yup.string().required("Address cannot be blank")
});

const getInitialvalues = (client?: any) => ({
  name: client?.name || "",
  email: client?.email || "",
  phone: client?.phone || "",
  address: client?.address || "",
  minutes: client?.minutes || "",
  client_logo: client?.client_logo || null
});

export const ClientForm = ({
  clientLogoUrl,
  handleSubmit,
  handleDeleteLogo,
  setClientLogoUrl,
  setClientLogo,
  clientData,
  formType="new",
  apiError=""
}: IClientForm) => {
  const onLogoChange = (e) => {
    const file = e.target.files[0];
    setClientLogoUrl(URL.createObjectURL(file));
    setClientLogo(file);
  };

  const showInitialOrNew = () => {
    if (formType === "edit") {
      return (
        <div className='flex flex-row items-center justify-center'>
          <div className='w-16 h-16'>
            <div className='flex justify-center w-full h-full'>
              <span className='rounded-full bg-miru-han-purple-1000 w-22 text-2xl text-center leading-10 text-gray-50 pt-2'>
                {clientData.name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
          </div>
          <input
            id='file-input'
            type='file'
            name='client_logo'
            className='hidden'
            onChange={onLogoChange}
          />
          <label htmlFor='file_input'>
            <img
              src={editButton}
              className='rounded-full cursor-pointer mx-1'
              style={{ minWidth: "30px" }}
              alt='edit'
            />
          </label>
          <input
            id='file_input'
            type='file'
            name='client_logo'
            className='hidden'
            onChange={onLogoChange}
          />
          <button onClick={handleDeleteLogo}>
            <img src={deleteImage} alt='delete' style={{ minWidth: "10px" }} />
          </button>
        </div>
      );
    } else {
      return (
        <div className='mt-2 flex flex-row justify-center'>
          <div className='w-20 h-20 border rounded-full border-miru-han-purple-1000 mt-2 '>
            <label
              htmlFor='file-input'
              className='flex justify-center w-full h-full cursor-pointer'
            >
              <img alt='profile_box' src={img} className='object-none' />
            </label>
            <input
              id='file-input'
              type='file'
              name='client_logo'
              className='hidden'
              onChange={onLogoChange}
            />
          </div>
        </div>
      );
    }
  };

  return (
    <Formik
      initialValues={getInitialvalues(clientData)}
      validationSchema={clientSchema}
      onSubmit={handleSubmit}
    >
      {(props: FormikProps<FormValues>) => {
        const { touched, errors } = props;
        return (
          <Form>
            <div className='mt-4'>
              <div className='mt-4'>
                <div className='field'>
                  <div className='mt-1'>
                    {clientLogoUrl !== "" ? (
                      <div className='mt-2 flex flex-row justify-center'>
                        <div className='w-20 h-20'>
                          <img
                            src={clientLogoUrl}
                            alt='client logo'
                            className='rounded-full min-w-full h-full'
                          />
                        </div>
                        <input
                          id='file_input'
                          type='file'
                          className='hidden'
                          onChange={onLogoChange}
                          name='client_logo'
                        />
                        <label htmlFor='file_input'>
                          <img
                            src={editButton}
                            className='rounded-full mt-5 cursor-pointer'
                            style={{ minWidth: "40px" }}
                            alt='edit'
                          />
                        </label>
                        <input
                          id='file_input'
                          type='file'
                          name='client_logo'
                          className='hidden'
                          onClick={onLogoChange}
                        />
                        <button type='button' onClick={handleDeleteLogo}>
                          <img
                            src={deleteImage}
                            alt='delete'
                            style={{ minWidth: "20px" }}
                          />
                        </button>
                      </div>
                    ) : (
                      showInitialOrNew()
                    )}
                  </div>
                </div>
              </div>
              <div className='field'>
                <div className='field_with_errors'>
                  <label className='form__label'>Name</label>
                  <div className='tracking-wider block text-xs text-red-600'>
                    {errors.name && touched.name && <div>{errors.name}</div>}
                  </div>
                </div>
                <div className='mt-1'>
                  <Field
                    className={`form__input ${
                      errors.name &&
                      touched.name &&
                      "border-red-600 focus:ring-red-600 focus:border-red-600"
                    } `}
                    name='name'
                  />
                </div>
              </div>
            </div>
            <div className='mt-4'>
              <div className='field'>
                <div className='field_with_errors'>
                  <label className='form__label'>Email</label>
                  <div className='tracking-wider block text-xs text-red-600'>
                    {errors.email && touched.email && <div>{errors.email}</div>}
                  </div>
                </div>
                <div className='mt-1'>
                  <Field
                    className={`form__input ${
                      errors.email &&
                      touched.email &&
                      "border-red-600 focus:ring-red-600 focus:border-red-600"
                    } `}
                    name='email'
                  />
                </div>
              </div>
            </div>
            <div className='mt-4'>
              <div className='field'>
                <div className='field_with_errors'>
                  <label className='form__label'>Phone number</label>
                  <div className='tracking-wider block text-xs text-red-600'>
                    {errors.phone && touched.phone && <div>{errors.phone}</div>}
                  </div>
                </div>
                <div className='mt-1'>
                  <Field
                    className={`form__input ${
                      errors.phone &&
                      touched.phone &&
                      "border-red-600 focus:ring-red-600 focus:border-red-600"
                    } `}
                    name='phone'
                  />
                </div>
              </div>
            </div>
            <div className='mt-4'>
              <div className='field'>
                <div className='field_with_errors'>
                  <label className='form__label'>Address</label>
                  <div className='tracking-wider block text-xs text-red-600'>
                    {errors.address && touched.address && (
                      <div>{errors.address}</div>
                    )}
                  </div>
                </div>
                <div className='mt-1'>
                  <Field
                    className={`form__input ${
                      errors.address &&
                      touched.address &&
                      "border-red-600 focus:ring-red-600 focus:border-red-600"
                    } `}
                    name='address'
                  />
                </div>
              </div>
            </div>
            <p className='tracking-wider mt-3 block text-xs text-red-600'>
              {apiError}
            </p>
            <div className='actions mt-4'>
              <input
                type='submit'
                name='commit'
                value='SAVE CHANGES'
                className='form__input_submit'
              />
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};
