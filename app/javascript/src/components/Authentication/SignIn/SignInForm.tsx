import React, { useRef, useState } from "react";

import { Formik, Form, FormikProps } from "formik";
import { GoogleSVG, MiruLogoSVG } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Toastr } from "StyledComponents";

import authenticationApi from "apis/authentication";
import { InputErrors, InputField } from "common/FormikFields";
import { MIRU_APP_URL, Paths } from "constants/index";
import { useAuthDispatch } from "context/auth";

import { signInFormInitialValues, signInFormValidationSchema } from "./utils";

import FooterLinks from "../FooterLinks";
import PrivacyPolicyModal from "../SignUp/PrivacyPolicyModal";
import TermsOfServiceModal from "../SignUp/TermsOfServiceModal";

interface SignInFormValues {
  email: string;
  password: string;
}

const SignInForm = () => {
  const [privacyModal, setPrivacyModal] = useState(false);
  const [termsOfServiceModal, setTermsOfServiceModal] = useState(false);
  const authDispatch = useAuthDispatch();
  const navigate = useNavigate();

  const googleOauth = useRef(null);
  const csrfToken = document
    .querySelector('[name="csrf-token"]')
    .getAttribute("content");

  const handleSignInFormSubmit = async (values: any, { setFieldError }) => {
    try {
      const res = await authenticationApi.signin(values);
      //@ts-expect-error for authDispatch initial values
      authDispatch({
        type: "LOGIN",
        payload: {
          token: res.data.user.token,
          email: res?.data?.user.email,
        },
      });

      setTimeout(
        () => (window.location.href = `${window.location.origin}`),
        500
      );
    } catch (error) {
      if (error?.response?.data?.unconfirmed) {
        navigate(`/email_confirmation?email=${values.email}`);
        Toastr.error(error.response.data.error);
      } else if (error?.response?.data?.error) {
        setFieldError("password", error.response.data.error);
      }
    }
  };

  const handlePrivacyPolicy = () => {
    setPrivacyModal(true);
  };

  const handleTermsOfService = () => {
    setTermsOfServiceModal(true);
  };

  const handleGoogleAuth = async () => {
    const googleForm = googleOauth?.current;

    if (googleForm) googleForm.submit();
  };

  const isBtnDisabled = (values: SignInFormValues) =>
    !(values.email?.trim() && values?.password?.trim());

  return (
    <div className="relative flex w-full flex-col items-center justify-center px-8 pt-5vh md:px-0 lg:w-1/2">
      <div className="d-block lg:hidden">
        <a href={MIRU_APP_URL} rel="noreferrer noopener">
          <img
            alt="miru-logo"
            className="d-block mx-auto mb-4 h-10 w-10 md:mb-10 md:h-16 md:w-16 lg:mb-20"
            src={MiruLogoSVG}
          />
        </a>
      </div>
      <div className="mx-auto w-full md:w-1/2 lg:mt-auto lg:w-352">
        <h1 className="text-center font-manrope text-2xl font-extrabold text-miru-han-purple-1000 md:text-3xl lg:text-4.5xl">
          Welcome back!
        </h1>
        <div className="pt-2vh lg:pt-5vh">
          <Formik
            initialValues={signInFormInitialValues}
            validateOnBlur={false}
            validateOnChange={false}
            validationSchema={signInFormValidationSchema}
            onSubmit={handleSignInFormSubmit}
          >
            {(props: FormikProps<SignInFormValues>) => {
              const { touched, errors, values, setFieldError, setFieldValue } =
                props;

              return (
                <Form>
                  <div className="field relative">
                    <InputField
                      autoFocus
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
                  <div>
                    <button
                      type="submit"
                      className={`form__button whitespace-nowrap ${
                        isBtnDisabled(values)
                          ? "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
                          : "cursor-pointer"
                      }`}
                    >
                      Sign In
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
                    Sign In with Google
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
          <p className="mb-3 pt-7 text-center font-manrope text-xs font-normal not-italic text-miru-dark-purple-1000">
            <span className="form__link inline cursor-pointer">
              <a href={Paths.FORGOT_PASSWORD}>
                <span className="mr-2 inline-block">Forgot Password?</span>
              </a>
            </span>
          </p>
          {/* <p className="pb-10 text-center font-manrope text-xs font-normal not-italic text-miru-dark-purple-1000">
            Don't have an account?&nbsp;
            <span className="form__link inline cursor-pointer">
              <a href={Paths.SIGNUP}>
                <span className="mr-2 inline-block">Sign Up</span>
              </a>
            </span>
          </p> */}
        </div>
      </div>
      <FooterLinks
        handlePrivacyPolicy={handlePrivacyPolicy}
        handleTermsOfService={handleTermsOfService}
      />
    </div>
  );
};

export default SignInForm;
