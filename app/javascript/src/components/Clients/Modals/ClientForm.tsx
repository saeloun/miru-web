/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState } from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import { Avatar } from "StyledComponents";
import * as Yup from "yup";

import { i18n } from "../../../i18n";

const editButton = require("../../../../../assets/images/edit_image_button.svg");
const deleteImage = require("../../../../../assets/images/redDelete.svg");

interface IClientForm {
  clientLogoUrl: string;
  handleSubmit: any;
  handleDeleteLogo: any;
  setClientLogoUrl: any;
  setClientLogo: any;
  formType?: string;
  clientData?: any;
  apiError?: string;
  dataCyName: string;
  dataCyPhone: string;
  dataCyAddress: string;
  dataCySubmit: string;
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
  dataCyName,
  dataCyAddress,
  dataCyPhone,
  dataCySubmit,
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
          i18n.t("invalidImageFormatSize", { fileSize: "30" })
        );
      } else if (isValid.fileExtension && !isValid.fileSizeValid) {
        setFileUploadError(i18n.t("invalidImageSize", { fileSize: "30" }));
      } else {
        setFileUploadError(i18n.t("invalidImageFormat"));
      }
    }
  };

  const isValidFileUploaded = file => {
    const validExtensions = ["png", "jpeg", "jpg"];
    const fileExtensions = file.type.split("/")[1];
    const validFileByteSize = "30000";
    const fileSize = file.size;

    return {
      fileExtension: validExtensions.includes(fileExtensions),
      fileSizeValid: fileSize <= validFileByteSize,
    };
  };

  const LogoComponent = () => (
    <div className="my-4 flex flex-row">
      <div className="mt-2 h-30 w-30 border border-dashed border-miru-dark-purple-400">
        <div className="profile-img relative m-auto cursor-pointer text-center text-xs font-semibold">
          <Avatar
            classNameImg="h-full w-full md:h-full md:w-full"
            url={clientLogoUrl}
          />
          <div className="hover-edit absolute top-0 left-0 h-full w-full bg-miru-white-1000 p-4 opacity-80">
            <button
              className="flex flex-row text-miru-han-purple-1000"
              type="button"
            >
              <label className="flex cursor-pointer" htmlFor="file_input">
                <img
                  alt="edit"
                  className="cursor-pointer rounded-full"
                  src={editButton}
                  style={{ minWidth: "40px" }}
                />
                <p className="my-auto">Edit</p>
              </label>
              <input
                className="hidden"
                id="file_input"
                name="logo"
                type="file"
                onChange={onLogoChange}
              />
            </button>
            <button
              className="flex flex-row pl-2 text-miru-red-400"
              type="button"
              onClick={handleDeleteLogo}
            >
              <img
                alt="delete"
                src={deleteImage}
                style={{ minWidth: "20px" }}
              />
              <p className="pl-3">Delete</p>
            </button>
          </div>
        </div>
      </div>
      <div className="my-auto ml-6 text-xs font-normal text-miru-dark-purple-400">
        <p>Accepted file formats: PNG, JPG, SVG.</p>
        <p>File size should be &#8826; 2MB.</p>
        <p>Image resolution should be 1:1.</p>
      </div>
      <input
        className="hidden"
        id="file_input"
        name="logo"
        type="file"
        onClick={onLogoChange}
      />
    </div>
  );

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
              <div className="my-4">
                <div className="field">
                  <div className="mt-1">
                    {formType == "edit" ? (
                      <LogoComponent />
                    ) : clientLogoUrl ? (
                      <LogoComponent />
                    ) : (
                      <div className="mt-2 flex flex-row">
                        <div className="mt-2 h-30 w-30 border border-dashed border-miru-dark-purple-400 ">
                          <label
                            className="flex h-full w-full cursor-pointer justify-center"
                            htmlFor="file-input"
                          >
                            <div className="m-auto cursor-pointer text-center text-xs font-semibold">
                              <p className="text-miru-dark-purple-400">
                                Drag logo
                              </p>
                              <p className="text-miru-dark-purple-400">or</p>
                              <p className="text-miru-han-purple-1000">
                                Select File
                              </p>
                            </div>
                          </label>
                          <input
                            className=""
                            id="file-input"
                            name="logo"
                            type="file"
                            onChange={onLogoChange}
                          />
                        </div>
                        <div className="my-auto ml-6 text-xs font-normal text-miru-dark-purple-400">
                          <p>Accepted file formats: PNG, JPG, SVG.</p>
                          <p>File size should be &#8826; 2MB.</p>
                          <p>Image resolution should be 1:1.</p>
                        </div>
                      </div>
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
                    data-cy={dataCyName}
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
                    data-cy={dataCyPhone}
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
                    data-cy={dataCyAddress}
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
                data-cy={dataCySubmit}
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
