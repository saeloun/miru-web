import React, { useRef } from "react";

import { Formik, Form, FormikProps } from "formik";
import { GoogleSVG, MiruLogoSVG } from "miruIcons";
import { useNavigate } from "react-router-dom";

import authenticationApi from "apis/authentication";
import { InputErrors, InputField } from "common/FormikFields";
import { MIRU_APP_URL, Paths } from "constants/index";

import { signUpFormInitialValues, signUpFormValidationSchema } from "./utils";

import FooterLinks from "../FooterLinks";

interface SignUpFormValues {
  firstName: string;
  lastName: string;
  email: string;
  isAgreedTermsOfServices: boolean;
  password: string;
  confirm_password: string;
}

const SignUpForm = () => {
  const navigate = useNavigate();

  const googleOauth = useRef(null);
  const csrfToken = document
    .querySelector('[name="csrf-token"]')
    .getAttribute("content");

  const handleSignUpFormSubmit = async (values: any) => {
    const { firstName, lastName, email, password, confirm_password } = values;
    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      password_confirmation: confirm_password,
    };
    const res = await authenticationApi.signup(payload);
    navigate(`/email_confirmation?email=${res.data.email}`);
  };

  const handleGoogleAuth = async () => {
    const googleForm = googleOauth?.current;

    if (googleForm) googleForm.submit();
  };

  const isBtnDisabled = (values: SignUpFormValues) =>
    !(
      values?.firstName?.trim() &&
      values?.lastName?.trim() &&
      values.email?.trim() &&
      values?.password?.trim() &&
      values?.confirm_password?.trim()
    );

  return (
    <div className="relative w-full px-8 pt-10 pb-4 md:px-0 md:pt-36 lg:w-1/2">
      <div className="mx-auto min-h-full md:w-1/2 lg:w-352">
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
        <div className="pt-10 lg:pt-20">
          <Formik
            initialValues={signUpFormInitialValues}
            validateOnBlur={false}
            validateOnChange={false}
            validationSchema={signUpFormValidationSchema}
            onSubmit={handleSignUpFormSubmit}
          >
            {(props: FormikProps<SignUpFormValues>) => {
              const { touched, errors, values, setFieldValue, setFieldError } =
                props;

              return (
                <Form>
                  <div className="flex justify-between">
                    <div className="field relative mr-2 w-1/2 md:mr-6 lg:w-168">
                      <InputField
                        hasError={errors.firstName && touched.firstName}
                        id="firstName"
                        label="First Name"
                        labelClassName="p-0"
                        name="firstName"
                        setFieldError={setFieldError}
                        setFieldValue={setFieldValue}
                      />
                      <InputErrors
                        fieldErrors={errors.firstName}
                        fieldTouched={touched.firstName}
                      />
                    </div>
                    <div className="field relative w-1/2 lg:w-168">
                      <InputField
                        hasError={errors.lastName && touched.lastName}
                        id="lastName"
                        label="Last Name"
                        labelClassName="p-0"
                        name="lastName"
                        setFieldError={setFieldError}
                        setFieldValue={setFieldValue}
                      />
                      <InputErrors
                        fieldErrors={errors.lastName}
                        fieldTouched={touched.lastName}
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
                      name="confirm_password"
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                      type="password"
                      hasError={
                        errors.confirm_password && touched.confirm_password
                      }
                    />
                    <InputErrors
                      fieldErrors={errors.confirm_password}
                      fieldTouched={touched.confirm_password}
                    />
                  </div>
                  <div className="mb-3">
                    <button
                      type="submit"
                      className={`form__button whitespace-nowrap ${
                        isBtnDisabled(values)
                          ? "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
                          : "cursor-pointer"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                  <div className="relative flex items-center py-7">
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
              onSubmit={() => {}} //eslint-disable-line
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
          </div>
          <p className="pt-5 pb-10 text-center font-manrope text-xs font-normal not-italic text-miru-dark-purple-1000">
            Already have an account?&nbsp;
            <span className="form__link inline cursor-pointer">
              <a href={Paths.LOGIN}>
                <span className="mr-2 inline-block">Sign In</span>
              </a>
            </span>
          </p>
        </div>
      </div>
      <FooterLinks />
    </div>
  );
};

export default SignUpForm;
