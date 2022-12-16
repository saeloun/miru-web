/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState } from "react";

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
  logo: any;
}

const clientSchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
  phone: Yup.number().typeError("Invalid phone number"),
  address: Yup.string().required("Address cannot be blank"),
});

const getInitialvalues = (client?: any) => ({
  name: client?.name || "",
  email: client?.email || "",
  phone: client?.phone || "",
  address: client?.address || "",
  minutes: client?.minutes || "",
  logo: client?.logo || null,
});

const ClientForm = ({
  clientLogoUrl,
  handleSubmit,
  handleDeleteLogo,
  setClientLogoUrl,
  setClientLogo,
  clientData,
  formType = "new",
  apiError = "",
}: IClientForm) => {
  const [fileUploadError, setFileUploadError] = useState<string>("");

  const onLogoChange = e => {
    const file = e.target.files[0];
    const isValid = isValidFileUploaded(file);

    if (isValid.fileExtension && isValid.fileSizeValid) {
      setClientLogoUrl(URL.createObjectURL(file));
      setClientLogo(file);
    } else {
      if (!isValid.fileExtension && !isValid.fileSizeValid) {
        setFileUploadError(
          "Incorrect file format. Please upload an image of type PNG or JPG. Max size (10kb)"
        );
      } else if (isValid.fileExtension && !isValid.fileSizeValid) {
        setFileUploadError("File size exceeded the max limit of 10KB.");
      } else {
        setFileUploadError(
          "Incorrect file format. Please upload an image of type PNG or JPG"
        );
      }
    }
  };

  const isValidFileUploaded = file => {
    const validExtensions = ["png", "jpeg", "jpg"];
    const fileExtensions = file.type.split("/")[1];
    const validFileByteSize = "10000";
    const fileSize = file.size;

    return {
      fileExtension: validExtensions.includes(fileExtensions),
      fileSizeValid: fileSize <= validFileByteSize,
    };
  };

  const showInitialOrNew = () => {
    if (formType === "edit") {
      return (
        <div className="flex flex-row items-center justify-center">
          <div className="h-16 w-16">
            <div className="flex h-full w-full justify-center">
              <span className="w-22 rounded-full bg-miru-han-purple-1000 pt-2 text-center text-2xl leading-10 text-gray-50">
                {clientData.name
                  .split(" ")
                  .map(name => name[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
          </div>
          <input
            className="hidden"
            id="file-input"
            name="logo"
            type="file"
            onChange={onLogoChange}
          />
          <label htmlFor="file_input">
            <img
              alt="edit"
              className="mx-1 cursor-pointer rounded-full"
              src={editButton}
              style={{ minWidth: "30px" }}
            />
          </label>
          <input
            className="hidden"
            id="file_input"
            name="logo"
            type="file"
            onChange={onLogoChange}
          />
          <button onClick={handleDeleteLogo}>
            <img alt="delete" src={deleteImage} style={{ minWidth: "10px" }} />
          </button>
        </div>
      );
    }

    return (
      <div className="mt-2 flex flex-row justify-center">
        <div className="mt-2 h-20 w-20 rounded-full border border-miru-han-purple-1000 ">
          <label
            className="flex h-full w-full cursor-pointer justify-center"
            htmlFor="file-input"
          >
            <img alt="profile_box" className="object-none" src={img} />
          </label>
          <input
            className="hidden"
            id="file-input"
            name="logo"
            type="file"
            onChange={onLogoChange}
          />
        </div>
      </div>
    );
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
            <div className="mt-4">
              <div className="mt-4">
                <div className="field">
                  <div className="mt-1">
                    {clientLogoUrl !== "" ? (
                      <div className="mt-2 flex flex-row justify-center">
                        <div className="h-20 w-20">
                          <img
                            alt="client logo"
                            className="h-full min-w-full rounded-full"
                            src={clientLogoUrl}
                          />
                        </div>
                        <input
                          className="hidden"
                          id="file_input"
                          name="logo"
                          type="file"
                          onChange={onLogoChange}
                        />
                        <label htmlFor="file_input">
                          <img
                            alt="edit"
                            className="mt-5 cursor-pointer rounded-full"
                            src={editButton}
                            style={{ minWidth: "40px" }}
                          />
                        </label>
                        <input
                          className="hidden"
                          id="file_input"
                          name="logo"
                          type="file"
                          onClick={onLogoChange}
                        />
                        <button type="button" onClick={handleDeleteLogo}>
                          <img
                            alt="delete"
                            src={deleteImage}
                            style={{ minWidth: "20px" }}
                          />
                        </button>
                      </div>
                    ) : (
                      showInitialOrNew()
                    )}
                    <p className="mt-3 block max-w-xs text-center text-xs tracking-wider text-red-600">
                      {fileUploadError}
                    </p>
                  </div>
                </div>
              </div>
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Name</label>
                  <div className="block text-xs tracking-wider text-red-600">
                    {errors.name && touched.name && <div>{errors.name}</div>}
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
                    {errors.email && touched.email && <div>{errors.email}</div>}
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
                    {errors.phone && touched.phone && <div>{errors.phone}</div>}
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
  );
};

export default ClientForm;
