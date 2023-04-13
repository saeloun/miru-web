/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState } from "react";

import { Field, Form, Formik, FormikProps } from "formik";
import { XIcon, EditImageButtonSVG, deleteImageIcon } from "miruIcons";
import { Avatar, Button, SidePanel } from "StyledComponents";
import * as Yup from "yup";

import { i18n } from "../../../i18n";

interface IClientForm {
  clientLogoUrl: string;
  handleSubmit: any;
  handleDeleteLogo: any;
  setClientLogoUrl: any;
  setClientLogo: any;
  formType?: string;
  clientData?: any;
  apiError?: string;
  setMobileClientView?: any;
  handleClose: any;
  editClientId?: string;
  handleEdit?: any;
  setSubmitting: any;
  submitting: boolean;
}

interface FormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo: any;
  country: string;
  zipcode: string;
  city: string;
  state: string;
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
  country: client?.country || "",
  zipcode: client?.zipcode || "",
  city: client?.city || "",
  state: client?.state || "",
});

const MobileClientForm = ({
  clientLogoUrl,
  handleSubmit,
  handleDeleteLogo,
  setClientLogoUrl,
  setClientLogo,
  clientData,
  formType = "new",
  apiError = "",
  setMobileClientView,
  handleClose,
  editClientId,
  handleEdit,
  setSubmitting,
  submitting,
}: IClientForm) => {
  // Name, email, phone number, Address line 1 & 2, country, state, city, zipcode

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
                  src={EditImageButtonSVG}
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
                src={deleteImageIcon}
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
    <SidePanel
      WrapperClassname="z-50 justify-content-between lg:hidden bg-white"
      setFilterVisibilty={setMobileClientView}
    >
      <SidePanel.Header className="mb-2 flex items-center justify-between bg-miru-han-purple-1000 px-5 py-5 text-white lg:bg-white lg:font-bold lg:text-miru-dark-purple-1000">
        <span className="flex w-full items-center justify-center pl-6 text-base font-medium leading-5">
          {editClientId ? "Edit Client" : "Add New Client"}
        </span>
        <Button style="ternary" onClick={handleClose}>
          <XIcon
            className="text-white lg:text-miru-dark-purple-1000"
            size={16}
          />
        </Button>
      </SidePanel.Header>
      <SidePanel.Body className="sidebar__filters flex h-full flex-col justify-between overflow-y-auto px-4">
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
                                  <p className="text-miru-dark-purple-400">
                                    or
                                  </p>
                                  <p className="text-miru-han-purple-1000">
                                    Select File
                                  </p>
                                </div>
                              </label>
                              <input
                                className="hidden"
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
                        } block h-12 w-full appearance-none border-miru-gray-1000 bg-white p-3.75 text-sm md:text-base`}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="field">
                    <div className="field_with_errors">
                      <label className="form__label">Email ID(s)</label>
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
                {/* Address line 2 */}
                <div className="mt-4">
                  <div className="field">
                    <div className="field_with_errors">
                      <label className="form__label">
                        Address line 2 (optional)
                      </label>
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
                <div className="flex">
                  {/* Country */}
                  <div className="mt-4 mr-2">
                    <div className="field">
                      <div className="field_with_errors">
                        <label className="form__label">Country</label>
                        <div className="block text-xs tracking-wider text-red-600">
                          {errors.country && touched.country && (
                            <div>{errors.address}</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-1">
                        <Field
                          name="country"
                          className={`form__input ${
                            errors.country &&
                            touched.country &&
                            "border-red-600 focus:border-red-600 focus:ring-red-600"
                          } `}
                        />
                      </div>
                    </div>
                  </div>
                  {/* State */}
                  <div className="mt-4">
                    <div className="field">
                      <div className="field_with_errors">
                        <label className="form__label">State</label>
                        <div className="block text-xs tracking-wider text-red-600">
                          {errors.state && touched.state && (
                            <div>{errors.address}</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-1">
                        <Field
                          name="state"
                          className={`form__input ${
                            errors.state &&
                            touched.state &&
                            "border-red-600 focus:border-red-600 focus:ring-red-600"
                          } `}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex">
                  {/* City */}
                  <div className="mt-4 mr-2">
                    <div className="field">
                      <div className="field_with_errors">
                        <label className="form__label">City</label>
                        <div className="block text-xs tracking-wider text-red-600">
                          {errors.city && touched.city && (
                            <div>{errors.address}</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-1">
                        <Field
                          name="city"
                          className={`form__input ${
                            errors.city &&
                            touched.city &&
                            "border-red-600 focus:border-red-600 focus:ring-red-600"
                          } `}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Zipcode */}
                  <div className="mt-4">
                    <div className="field">
                      <div className="field_with_errors">
                        <label className="form__label">Zipcode</label>
                        <div className="block text-xs tracking-wider text-red-600">
                          {errors.zipcode && touched.zipcode && (
                            <div>{errors.address}</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-1">
                        <Field
                          name="zipcode"
                          className={`form__input ${
                            errors.zipcode &&
                            touched.zipcode &&
                            "border-red-600 focus:border-red-600 focus:ring-red-600"
                          } `}
                        />
                      </div>
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
        <SidePanel.Footer className="sidebar__footer h-auto w-full justify-around px-0">
          {editClientId ? (
            <Button
              className="w-full p-2 text-center text-base font-bold"
              //   disabled={!disableApplyBtn}
              style="primary"
              onClick={handleEdit}
            >
              Save Changes
            </Button>
          ) : (
            <Button
              className="w-full p-2 text-center text-base font-bold"
              disabled={submitting}
              style="primary"
              onClick={() => {
                setSubmitting(true);
                handleSubmit();
              }}
            >
              Add Client
            </Button>
          )}
        </SidePanel.Footer>
      </SidePanel.Body>
    </SidePanel>
  );
};

export default MobileClientForm;
