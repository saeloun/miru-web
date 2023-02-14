/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState } from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import { Avatar } from "StyledComponents";
import * as Yup from "yup";

import { i18n } from "../../../i18n";

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
    <div className="mt-2 flex flex-row items-center justify-center">
      <div className="flex h-16 w-16 items-center justify-center">
        <Avatar url={clientLogoUrl} />
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
          className="cursor-pointer rounded-full"
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
      {clientLogoUrl && (
        <button type="button" onClick={handleDeleteLogo}>
          <img alt="delete" src={deleteImage} style={{ minWidth: "20px" }} />
        </button>
      )}
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
              <div className="mt-4">
                <div className="field">
                  <div className="mt-1">
                    {formType == "edit" ? (
                      <LogoComponent />
                    ) : clientLogoUrl ? (
                      <LogoComponent />
                    ) : (
                      <div className="mt-2 flex flex-row justify-center">
                        <div className="mt-2 h-20 w-20 rounded-full border border-miru-han-purple-1000 ">
                          <label
                            className="flex h-full w-full cursor-pointer justify-center"
                            htmlFor="file-input"
                          >
                            <img
                              alt="profile_box"
                              className="object-none"
                              src={img}
                            />
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
