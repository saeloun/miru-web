/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState } from "react";

import { City, State } from "country-state-city";
import { Field, Form, Formik, FormikProps } from "formik";
import { XIcon, EditImageButtonSVG, deleteImageIcon } from "miruIcons";
import { Avatar, Button, SidePanel } from "StyledComponents";
import * as Yup from "yup";

import clientApi from "apis/clients";
import CustomReactSelect from "common/CustomReactSelect";
import { InputErrors, InputField } from "common/FormikFields";
import Toastr from "common/Toastr";
import { CountryList } from "constants/countryList";

import { formatFormData } from "./utils";

import { i18n } from "../../../i18n";

interface IClientForm {
  clientLogoUrl: string;
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
  setClientData: any;
  setnewClient: any;
  setApiError: any;
  setShowEditDialog?: any;
  clientLogo?: any;
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
  setnewClient,
  setApiError,
  setClientData,
  setShowEditDialog,
  clientLogo,
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

  const handleSubmit = async values => {
    const formData = new FormData();

    formatFormData(
      formData,
      values,
      formType === "new",
      clientData,
      clientLogo,
      clientLogoUrl
    );
    if (formType === "new") {
      try {
        const res = await clientApi.create(formData);
        setClientData([...clientData, { ...res.data, minutes: 0 }]);
        setnewClient(false);
        Toastr.success("Client added successfully");
      } catch (error) {
        setApiError(error.message);
      }
    } else {
      await clientApi
        .update(clientData.id, formData)
        .then(() => {
          setShowEditDialog(false);
          window.location.reload();
        })
        .catch(e => {
          setApiError(e.message);
        });
    }
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
            const { touched, errors, setFieldError, setFieldValue, values } =
              props;

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
                    <InputField
                      hasError={errors.name && touched.name}
                      id="name"
                      label="Name"
                      labelClassName="p-0"
                      name="name"
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                    />
                    <InputErrors
                      fieldErrors={errors.name}
                      fieldTouched={touched.name}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="field">
                    <InputField
                      hasError={errors.email && touched.email}
                      id="email"
                      label="Email ID(s)"
                      labelClassName="p-0"
                      name="email"
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                    />
                    <InputErrors
                      fieldErrors={errors.email}
                      fieldTouched={touched.email}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="field">
                    <InputField
                      hasError={errors.phone && touched.phone}
                      id="phone"
                      inputBoxClassName="pl-8"
                      label="Phone number"
                      labelClassName="p-0 pl-8 focus:p-2"
                      name="phone"
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                      type="tel"
                    />
                    <InputErrors
                      fieldErrors={errors.phone}
                      fieldTouched={touched.phone}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="field">
                    <InputField
                      hasError={errors.address && touched.address}
                      id="address"
                      label="Address line 1"
                      labelClassName="p-0"
                      name="address"
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                    />
                    <InputErrors
                      fieldErrors={errors.address}
                      fieldTouched={touched.address}
                    />
                  </div>
                </div>
                {/* Address line 2 */}
                <div className="mt-4">
                  <div className="field">
                    <InputField
                      hasError={errors.address && touched.address}
                      id="address"
                      label="Address line 2"
                      labelClassName="p-0"
                      name="address"
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                    />
                    <InputErrors
                      fieldErrors={errors.address}
                      fieldTouched={touched.address}
                    />
                  </div>
                </div>
                <div className="flex">
                  {/* Country */}
                  <div className="mt-4 mr-2">
                    <div className="field">
                      <Field name="country">
                        {({ form }) => (
                          <CustomReactSelect
                            isSearchable
                            className="w-44"
                            getOptionLabel={options => options["name"]}
                            getOptionValue={options => options["code"]}
                            isErr={errors.country && touched.country}
                            label="Country"
                            name="country"
                            options={CountryList}
                            placeholder="Country"
                            handleOnChange={selectedOption => {
                              form.setFieldValue(
                                "country",
                                selectedOption.code
                              );
                            }}
                            value={CountryList.find(
                              option => option.code === values.country
                            )}
                          />
                        )}
                      </Field>
                    </div>
                  </div>
                  {/* State */}
                  <div className="mt-4">
                    <div className="field">
                      <Field name="state">
                        {({ form }) => (
                          <CustomReactSelect
                            isSearchable
                            className="w-44"
                            getOptionLabel={options => options["name"]}
                            getOptionValue={options => options["code"]}
                            isErr={errors.state && touched.state}
                            label="State"
                            name="state"
                            options={State.getStatesOfCountry(values.country)}
                            placeholder="State"
                            value={State.getStatesOfCountry(values.country)}
                            handleOnChange={selectedOption => {
                              form.setFieldValue(
                                "state",
                                selectedOption.isoCode
                              );
                            }}
                          />
                        )}
                      </Field>
                    </div>
                  </div>
                </div>
                <div className="flex">
                  {/* City */}
                  <div className="mt-4 mr-2">
                    <div className="field">
                      <Field name="city">
                        {({ form }) => (
                          <CustomReactSelect
                            isSearchable
                            className="w-44"
                            getOptionLabel={options => options["name"]}
                            getOptionValue={options => options["code"]}
                            isErr={errors.city && touched.city}
                            label="City"
                            name="city"
                            placeholder="City"
                            handleOnChange={selectedOption => {
                              form.setFieldValue("city", selectedOption.name);
                            }}
                            options={City.getCitiesOfState(
                              values.country,
                              values.state
                            )}
                            value={City.getCitiesOfState(
                              values.country,
                              values.state
                            )}
                          />
                        )}
                      </Field>
                    </div>
                  </div>
                  {/* Zipcode */}
                  <div className="mt-4">
                    <div className="field">
                      <InputField
                        hasError={errors.zipcode && touched.zipcode}
                        id="zipcode"
                        inputBoxClassName="p-0"
                        label="Zipcode"
                        labelClassName="p-0"
                        name="zipcode"
                        setFieldError={setFieldError}
                        setFieldValue={setFieldValue}
                      />
                      <InputErrors
                        fieldErrors={errors.zipcode}
                        fieldTouched={touched.zipcode}
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-2 block text-xs tracking-wider text-red-600">
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
