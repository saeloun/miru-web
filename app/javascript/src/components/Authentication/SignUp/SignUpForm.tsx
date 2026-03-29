import { Paths } from "constants/index";

import React, { useRef, useState } from "react";

import { authenticationApi } from "apis/api";
import { InputErrors, InputField } from "common/FormikFields";
import { Formik, Form, FormikProps } from "formik";
import { GithubIcon, GoogleSVG } from "miruIcons";
import { useNavigate } from "react-router-dom";

import PrivacyPolicyModal from "./PrivacyPolicyModal";
import TermsOfServiceModal from "./TermsOfServiceModal";
import { signUpFormInitialValues, signUpFormValidationSchema } from "./utils";
import AuthShell from "../AuthShell";

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
  const githubOauth = useRef(null);
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

  const handleGithubAuth = async () => {
    const githubForm = githubOauth?.current;
    if (githubForm) githubForm.submit();
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
    <AuthShell
      description="Set up clients, projects, invoices, and payments in one clear operating system."
      title="Create your workspace"
    >
      <div>
        <Formik
          initialValues={{}}
          validateOnBlur={false}
          validationSchema=""
          onSubmit={() => {}}
        >
          {() => (
            <div className="mb-6 space-y-3">
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
                  className="flex w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent"
                  type="submit"
                  onClick={handleGoogleAuth}
                >
                  <img alt="" className="mr-2" src={GoogleSVG} />
                  Continue with Google
                </button>
              </Form>
              <Form action="/users/auth/github" method="post" ref={githubOauth}>
                <input
                  name="authenticity_token"
                  type="hidden"
                  value={csrfToken}
                />
                <button
                  className="flex w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent"
                  type="submit"
                  onClick={handleGithubAuth}
                >
                  <GithubIcon
                    className="mr-2 h-4 w-4 text-foreground"
                    weight="fill"
                  />
                  Continue with GitHub
                </button>
              </Form>
            </div>
          )}
        </Formik>
        <div className="relative mb-6 flex items-center">
          <div className="flex-grow border-t border-border" />
          <span className="mx-4 flex-shrink text-xs uppercase tracking-[0.18em] text-muted-foreground">
            or use email
          </span>
          <div className="flex-grow border-t border-border" />
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
                        labelClassName="p-0 text-foreground"
                        name="first_name"
                        inputBoxClassName="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus-visible:ring-ring"
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
                        labelClassName="p-0 text-foreground"
                        name="last_name"
                        inputBoxClassName="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus-visible:ring-ring"
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
                      labelClassName="p-0 text-foreground"
                      name="email"
                      inputBoxClassName="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus-visible:ring-ring"
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
                      labelClassName="p-0 text-foreground"
                      name="password"
                      inputBoxClassName="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus-visible:ring-ring"
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
                      labelClassName="p-0 text-foreground"
                      marginBottom="mb-2"
                      name="confirm_password"
                      inputBoxClassName="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus-visible:ring-ring"
                      setFieldError={setFieldError}
                      setFieldValue={setFieldValue}
                      type="password"
                      hasError={
                        errors.confirm_password && touched.confirm_password
                      }
                    />
                    {showPasswordCriteria(errors, touched) && (
                      <p className="text-xs font-medium leading-4 text-muted-foreground">
                        Min. 8 characters, 1 uppercase, 1 lowercase, 1 number
                        and 1 special character
                      </p>
                    )}
                    <InputErrors
                      fieldErrors={errors.confirm_password}
                      fieldTouched={touched.confirm_password}
                    />
                  </div>
                  <div className="my-5 flex items-start gap-2 text-xs text-muted-foreground">
                    <input
                      checked={values.isAgreedTermsOfServices}
                      className="mt-0.5 h-4 w-4 rounded border-border bg-background accent-primary"
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
                        className="text-foreground hover:text-primary"
                        onClick={handleTermsOfService}
                        type="button"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        className="text-foreground hover:text-primary"
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
                      className={`w-full rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        isBtnDisabled(values, errors)
                          ? "cursor-not-allowed border-transparent bg-muted text-muted-foreground"
                          : "cursor-pointer border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      Create account
                    </button>
                  </div>
                </Form>
              );
            }}
          </Formik>
          <div className="mt-4">
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
          <p className="pt-3 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <span className="inline cursor-pointer">
              <a href={Paths.LOGIN}>
                <span className="inline-block text-foreground hover:text-primary">
                  Sign in
                </span>
              </a>
            </span>
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <button
              className="hover:text-foreground"
              onClick={handlePrivacyPolicy}
              type="button"
            >
              Privacy
            </button>
            <span>•</span>
            <button
              className="hover:text-foreground"
              onClick={handleTermsOfService}
              type="button"
            >
              Terms
            </button>
          </div>
        </div>
      </div>
    </AuthShell>
  );
};

export default SignUpForm;
