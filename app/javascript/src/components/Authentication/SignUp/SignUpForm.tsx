import { Paths } from "constants/index";

import React, { useRef, useState } from "react";

import { authenticationApi } from "apis/api";
import { InputErrors, InputField } from "common/FormikFields";
import { Formik, Form, FormikProps } from "formik";
import { GoogleSVG, MiruLogoSVG } from "miruIcons";
import { useNavigate } from "react-router-dom";

import PrivacyPolicyModal from "./PrivacyPolicyModal";
import TermsOfServiceModal from "./TermsOfServiceModal";
import { signUpFormInitialValues, signUpFormValidationSchema } from "./utils";
import AuthThemeToggle from "../AuthThemeToggle";

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
  const csrfToken =
    document.querySelector('[name="csrf-token"]')?.getAttribute("content") ||
    "";

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
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-8 text-neutral-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="absolute right-4 top-4">
        <AuthThemeToggle />
      </div>
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8 dark:border-white/10 dark:bg-slate-800/90">
        <div className="mb-6 space-y-2 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/15 dark:bg-slate-900">
            <img
              alt="Miru"
              className="h-7 w-7 object-contain"
              src={MiruLogoSVG}
            />
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
            Miru
          </p>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            Create account
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Start your workspace in minutes.
          </p>
        </div>
        <div>
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
                        labelClassName="p-0 text-neutral-700 dark:text-neutral-300"
                        name="first_name"
                        inputBoxClassName="h-11 border-black/10 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-neutral-400 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus-visible:ring-slate-500"
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
                        labelClassName="p-0 text-neutral-700 dark:text-neutral-300"
                        name="last_name"
                        inputBoxClassName="h-11 border-black/10 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-neutral-400 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus-visible:ring-slate-500"
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
                      labelClassName="p-0 text-neutral-700 dark:text-neutral-300"
                      name="email"
                      inputBoxClassName="h-11 border-black/10 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-neutral-400 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus-visible:ring-slate-500"
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
                      labelClassName="p-0 text-neutral-700 dark:text-neutral-300"
                      name="password"
                      inputBoxClassName="h-11 border-black/10 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-neutral-400 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus-visible:ring-slate-500"
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
                      labelClassName="p-0 text-neutral-700 dark:text-neutral-300"
                      marginBottom="mb-2"
                      name="confirm_password"
                      inputBoxClassName="h-11 border-black/10 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-400 focus-visible:ring-neutral-400 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus-visible:ring-slate-500"
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                      type="password"
                      hasError={
                        errors.confirm_password && touched.confirm_password
                      }
                    />
                    {showPasswordCriteria(errors, touched) && (
                      <p className="text-xs font-medium leading-4 text-neutral-500">
                        Min. 8 characters, 1 uppercase, 1 lowercase, 1 number
                        and 1 special character
                      </p>
                    )}
                    <InputErrors
                      fieldErrors={errors.confirm_password}
                      fieldTouched={touched.confirm_password}
                    />
                  </div>
                  <div className="my-5 flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <input
                      checked={values.isAgreedTermsOfServices}
                      className="mt-0.5 h-4 w-4 rounded border-black/20 bg-white accent-neutral-900 dark:border-white/20 dark:bg-slate-900 dark:accent-white"
                      id="termsOfService"
                      name="agreeToTerms"
                      onChange={event => {
                        setFieldValue(
                          "isAgreedTermsOfServices",
                          event.target.checked
                        );
                        setFieldTouched("isAgreedTermsOfServices", false);
                      }}
                      type="checkbox"
                    />
                    <label className="leading-5" htmlFor="termsOfService">
                      I agree to the{" "}
                      <button
                        className="text-neutral-800 hover:text-black dark:text-neutral-200 dark:hover:text-white"
                        onClick={handleTermsOfService}
                        type="button"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        className="text-neutral-800 hover:text-black dark:text-neutral-200 dark:hover:text-white"
                        onClick={handlePrivacyPolicy}
                        type="button"
                      >
                        Privacy Policy
                      </button>
                    </label>
                  </div>
                  <InputErrors
                    fieldErrors={errors.isAgreedTermsOfServices}
                    fieldTouched={touched.isAgreedTermsOfServices}
                  />
                  <div className="mb-3">
                    <button
                      type="submit"
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                        isBtnDisabled(values, errors)
                          ? "cursor-not-allowed border-transparent bg-neutral-300 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
                          : "cursor-pointer border-black/10 bg-neutral-900 text-white hover:bg-neutral-800 dark:border-white/15 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                  <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-black/10 dark:border-white/10" />
                    <span className="mx-4 flex-shrink text-xs text-neutral-500">
                      or
                    </span>
                    <div className="flex-grow border-t border-black/10 dark:border-white/10" />
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
                    className="flex w-full items-center justify-center rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-700"
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
          <p className="pt-3 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Already have an account?{" "}
            <span className="inline cursor-pointer">
              <a href={Paths.LOGIN}>
                <span className="inline-block text-black hover:text-neutral-700 dark:text-white dark:hover:text-neutral-200">
                  Sign in
                </span>
              </a>
            </span>
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-500 dark:text-slate-400">
            <button
              className="hover:text-neutral-700 dark:hover:text-slate-100"
              onClick={handlePrivacyPolicy}
              type="button"
            >
              Privacy
            </button>
            <span>•</span>
            <button
              className="hover:text-neutral-700 dark:hover:text-slate-100"
              onClick={handleTermsOfService}
              type="button"
            >
              Terms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
