import { MIRU_APP_URL, Paths } from "constants/index";

import React, { useRef, useState } from "react";

import authenticationApi from "apis/authentication";
import CustomCheckbox from "common/CustomCheckbox";
import { InputErrors, InputField } from "common/FormikFields";
import { Formik, Form, FormikProps } from "formik";
import { GoogleSVG, MiruLogoSVG } from "miruIcons";
import { useNavigate } from "react-router-dom";

import PrivacyPolicyModal from "./PrivacyPolicyModal";
import TermsOfServiceModal from "./TermsOfServiceModal";
import { signUpFormInitialValues, signUpFormValidationSchema } from "./utils";

import FooterLinks from "../FooterLinks";

interface SignUpFormValues {
  first_name: string;
  last_name: string;
  email: string;
  isAgreedTermsOfServices: boolean;
  password: string;
  confirm_password: string;
}

const SignUpForm = () => {
  const [privacyModal, setPrivacyModal] = useState(false);
  const [termsOfServiceModal, setTermsOfServiceModal] = useState(false);
  const navigate = useNavigate();

  const googleOauth = useRef(null);
  const csrfToken = document
    .querySelector('[name="csrf-token"]')
    .getAttribute("content");

  const handleSignUpFormSubmit = async (values: any, { setFieldError }) => {
    try {
      const { first_name, last_name, email, password, confirm_password } =
        values;

      const payload = {
        first_name,
        last_name,
        email,
        password,
        password_confirmation: confirm_password,
      };
      const res = await authenticationApi.signup(payload);
      navigate(`/email_confirmation?email=${res.data.email}`);
    } catch (error) {
      if (error?.response?.data?.error) {
        const errorData = error.response.data.error;
        Object.keys(errorData).forEach(key => {
          const errorMessages = errorData[key];
          setFieldError(key, errorMessages[0]);
        });
      }
    }
  };

  const showPasswordCriteria = (errors, touched) => {
    if (errors.confirm_password || errors.password) {
      if (touched.password || touched.confirm_password) return false;
    }

    return true;
  };

  const handleGoogleAuth = async () => {
    const googleForm = googleOauth?.current;
    if (googleForm) googleForm.submit();
  };

  const handlePrivacyPolicy = () => {
    setPrivacyModal(true);
  };

  const handleTermsOfService = () => {
    setTermsOfServiceModal(true);
  };

  const isBtnDisabled = (values: SignUpFormValues, errors) =>
    !(
      values?.first_name?.trim() &&
      values?.last_name?.trim() &&
      values.email?.trim() &&
      values?.password?.trim() &&
      values?.confirm_password?.trim() &&
      values?.password?.trim() == values?.confirm_password?.trim()
    ) ||
    errors?.first_name ||
    errors?.last_name?.trim() ||
    errors.email?.trim() ||
    errors?.password?.trim() ||
    errors?.confirm_password?.trim();

  return (
    <div className="relative flex w-full flex-col items-center justify-center px-8 pt-5vh md:px-0 lg:w-1/2">
      <div className="mx-auto mt-auto md:w-1/2 lg:w-352">
        <div className="d-block lg:hidden">
          <a href={MIRU_APP_URL} rel="noreferrer noopener">
            <img
              alt="miru-logo"
              className="d-block mx-auto mb-4 h-10 w-10 md:mb-10 md:h-16 md:w-16 lg:mb-20"
              src={MiruLogoSVG}
            />
          </a>
        </div>
        <h1 className="text-center font-manrope text-2xl font-extrabold text-miru-han-purple-1000 md:text-3xl lg:text-4.5xl">
          Signup for Miru
        </h1>
        <div className="pt-2vh lg:pt-5vh">
          <Formik
            validateOnBlur
            initialValues={signUpFormInitialValues}
            validateOnChange={false}
            validationSchema={signUpFormValidationSchema}
            onSubmit={handleSignUpFormSubmit}
          >
            {(props: FormikProps<SignUpFormValues>) => {
              const {
                touched,
                errors,
                values,
                setFieldValue,
                setFieldError,
                setFieldTouched,
              } = props;

              return (
                <Form>
                  <div className="flex justify-between">
                    <div className="field relative mr-2 w-1/2 md:mr-6 lg:w-168">
                      <InputField
                        hasError={errors.first_name && touched.first_name}
                        id="first_name"
                        label="First Name"
                        labelClassName="p-0"
                        name="first_name"
                        setFieldError={setFieldError}
                        setFieldValue={setFieldValue}
                      />
                      <InputErrors
                        fieldErrors={errors.first_name}
                        fieldTouched={touched.first_name}
                      />
                    </div>
                    <div className="field relative w-1/2 lg:w-168">
                      <InputField
                        hasError={errors.last_name && touched.last_name}
                        id="last_name"
                        label="Last Name"
                        labelClassName="p-0"
                        name="last_name"
                        setFieldError={setFieldError}
                        setFieldValue={setFieldValue}
                      />
                      <InputErrors
                        fieldErrors={errors.last_name}
                        fieldTouched={touched.last_name}
                      />
                    </div>
                  </div>
                  <div className="field relative">
                    <InputField
                      hasError={errors.email && touched.email}
                      id="email"
                      label="Email"
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
                  <div className="field">
                    <InputField
                      hasError={errors.password && touched.password}
                      id="password"
                      label="Password"
                      labelClassName="p-0"
                      name="password"
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                      type="password"
                      wrapperClassName={`${!errors.password && "mb-6"}`}
                    />
                    <InputErrors
                      fieldErrors={errors.password}
                      fieldTouched={touched.password}
                    />
                  </div>
                  <div className="field">
                    <InputField
                      id="confirm_password"
                      label="Confirm Password"
                      labelClassName="p-0"
                      marginBottom="mb-2"
                      name="confirm_password"
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                      type="password"
                      hasError={
                        errors.confirm_password && touched.confirm_password
                      }
                    />
                    {showPasswordCriteria(errors, touched) && (
                      <p className="text-xs font-medium leading-4 text-miru-dark-purple-400">
                        Min. 8 characters, 1 uppercase, 1 lowercase, 1 number
                        and 1 special character
                      </p>
                    )}
                    <InputErrors
                      fieldErrors={errors.confirm_password}
                      fieldTouched={touched.confirm_password}
                    />
                  </div>
                  <div className="my-6 flex text-xs font-normal leading-4 text-miru-dark-purple-1000">
                    <div className="mt-2 flex">
                      <CustomCheckbox
                        isUpdatedDesign
                        checkboxValue="termsOfService"
                        id="termsOfService"
                        isChecked={values.isAgreedTermsOfServices}
                        name="agreeToTerms"
                        wrapperClassName=""
                        handleCheck={event => {
                          setFieldValue(
                            "isAgreedTermsOfServices",
                            event.target.checked
                          );
                          setFieldTouched("isAgreedTermsOfServices", false);
                        }}
                      />
                      <h4 className="ml-2">
                        I agree to the&nbsp;
                        <span
                          className="form__link cursor-pointer"
                          onClick={handleTermsOfService}
                        >
                          Terms of Service&nbsp;
                        </span>
                        and&nbsp;
                        <span
                          className="form__link cursor-pointer"
                          onClick={handlePrivacyPolicy}
                        >
                          Privacy Policy
                        </span>
                      </h4>
                    </div>
                  </div>
                  <InputErrors
                    fieldErrors={errors.isAgreedTermsOfServices}
                    fieldTouched={touched.isAgreedTermsOfServices}
                  />
                  <div className="mb-3">
                    <button
                      type="submit"
                      className={`form__button whitespace-nowrap ${
                        isBtnDisabled(values, errors)
                          ? "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
                          : "cursor-pointer"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                  <div className="relative flex items-center py-2vh">
                    <div className="flex-grow border-t border-miru-gray-1000" />
                    <span className="mx-4 flex-shrink text-xs text-miru-dark-purple-1000">
                      or
                    </span>
                    <div className="flex-grow border-t border-miru-gray-1000" />
                  </div>
                </Form>
              );
            }}
          </Formik>
          <div className="mb-3">
            <Formik
              initialValues={{}}
              validateOnBlur={false}
              validationSchema=""
              onSubmit={() => {
                /* Google OAuth form - no client-side submit handler needed */
              }}
            >
              {() => (
                <Form
                  action="/users/auth/google_oauth2"
                  method="post"
                  ref={googleOauth}
                >
                  <input
                    name="authenticity_token"
                    type="hidden"
                    value={csrfToken}
                  />
                  <button
                    className="form__button whitespace-nowrap"
                    type="submit"
                    onClick={handleGoogleAuth}
                  >
                    <img alt="" className="mr-2" src={GoogleSVG} />
                    Sign Up with Google
                  </button>
                </Form>
              )}
            </Formik>
            {privacyModal && (
              <PrivacyPolicyModal
                isOpen={privacyModal}
                onClose={() => setPrivacyModal(false)}
              />
            )}
            {termsOfServiceModal && (
              <TermsOfServiceModal
                isOpen={termsOfServiceModal}
                onClose={() => setTermsOfServiceModal(false)}
              />
            )}
          </div>
          <p className="py-2vh text-center font-manrope text-xs font-normal not-italic text-miru-dark-purple-1000">
            Already have an account?&nbsp;
            <span className="form__link inline cursor-pointer">
              <a href={Paths.LOGIN}>
                <span className="mr-2 inline-block">Sign In</span>
              </a>
            </span>
          </p>
        </div>
      </div>
      <FooterLinks
        handlePrivacyPolicy={handlePrivacyPolicy}
        handleTermsOfService={handleTermsOfService}
      />
    </div>
  );
};

export default SignUpForm;
