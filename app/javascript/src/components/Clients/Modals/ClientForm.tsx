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
}

interface FormValues {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
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
  address1: client?.address1 || "",
  address2: client?.address2 || "",
  country: client?.country || "",
  state: client?.state || "",
  city: client?.city || "",
  zipcode: client?.zipcode || "",
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
            </div>
            <div className="field">
              <div className="block text-right text-xs tracking-wider text-red-600">
                {errors.name && touched.name && <div>{errors.name}</div>}
              </div>
              <div className="outline relative">
                <Field
                  name="name"
                  placeholder=" "
                  className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                    errors.name &&
                    touched.name &&
                    "border-red-600 focus:border-red-600 focus:ring-red-600"
                  } `}
                />
                <label
                  className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                  htmlFor="Name"
                >
                  Name
                </label>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="block text-right text-xs tracking-wider text-red-600">
                  {errors.email && touched.email && <div>{errors.email}</div>}
                </div>
                <div className="outline relative">
                  <Field
                    name="email"
                    placeholder=" "
                    className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                      errors.email &&
                      touched.email &&
                      "border-red-600 focus:border-red-600 focus:ring-red-600"
                    } `}
                  />
                  <label
                    className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="Email"
                  >
                    Email
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="block text-right text-xs tracking-wider text-red-600">
                  {errors.phone && touched.phone && <div>{errors.phone}</div>}
                </div>
                <div className="outline relative">
                  <Field
                    name="phone"
                    placeholder=" "
                    className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                      errors.phone &&
                      touched.phone &&
                      "border-red-600 focus:border-red-600 focus:ring-red-600"
                    } `}
                  />
                  <label
                    className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="Phone number"
                  >
                    Phone number
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="block text-right text-xs tracking-wider text-red-600">
                  {errors.address1 && touched.address1 && (
                    <div>{errors.address1}</div>
                  )}
                </div>
                <div className="outline relative">
                  <Field
                    name="address1"
                    placeholder=" "
                    className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                      errors.address1 &&
                      touched.address1 &&
                      "border-red-600 focus:border-red-600 focus:ring-red-600"
                    } `}
                  />
                  <label
                    className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="address1"
                  >
                    Address line 1
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="field">
                <div className="outline relative">
                  <Field
                    className="form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000"
                    data-cy="address-input"
                    name="address2"
                    placeholder=" "
                  />
                  <label
                    className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="address2"
                  >
                    Address line 2 (optional)
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <div className="field">
                <div className="outline relative border focus-within:border-miru-han-purple-1000">
                  <Field
                    className="form__input focus:outline-none block h-12 w-full appearance-none bg-transparent p-4 text-base"
                    data-cy="address-input"
                    name="country"
                    placeholder=" "
                  />
                  <label
                    className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="country"
                  >
                    Country
                  </label>
                </div>
              </div>
              <div className="field">
                <div className="outline relative border focus-within:border-miru-han-purple-1000">
                  <Field
                    className="form__input focus:outline-none block h-12 w-full appearance-none bg-transparent p-4 text-base"
                    data-cy="address-input"
                    name="state"
                    placeholder=" "
                  />
                  <label
                    className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="state"
                  >
                    State
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <div className="field">
                <div className="outline relative">
                  <Field
                    className="form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000"
                    data-cy="address-input"
                    name="city"
                    placeholder=" "
                  />
                  <label
                    className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="city"
                  >
                    City
                  </label>
                </div>
              </div>
              <div className="field">
                <div className="outline relative">
                  <Field
                    className="form__input focus:outline-none block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000"
                    data-cy="address-input"
                    name="zipcode"
                    placeholder=" "
                  />
                  <label
                    className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="zipcode"
                  >
                    Zipcode
                  </label>
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
