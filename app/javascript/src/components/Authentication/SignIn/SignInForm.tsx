import { Paths } from "constants/index";

import React, { useRef, useState } from "react";

import { authenticationApi } from "apis/api";
import { InputErrors, InputField } from "common/FormikFields";
import { useAuthDispatch } from "context/auth";
import { Formik, Form, FormikProps } from "formik";
import { GoogleSVG, MiruLogoSVG } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { signInFormInitialValues, signInFormValidationSchema } from "./utils";

import AuthThemeToggle from "../AuthThemeToggle";
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
  const csrfToken =
    document.querySelector('[name="csrf-token"]')?.getAttribute("content") ||
    "";

  const handleSignInFormSubmit = async (values: any, { setFieldError }) => {
    try {
      const res = await authenticationApi.signin(values);
      const { user, company_role, company } = res.data;

      if (user?.token) {
        // Store auth credentials
        authDispatch({
          type: "LOGIN",
          payload: {
            token: user.token,
            email: user.email,
          },
        });

        // Store full user data for context
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("company_role", company_role || "");
        if (company) {
          localStorage.setItem("company", JSON.stringify(company));
        }

        // Navigate to home after successful login
        toast.success("Welcome back!");
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        throw new Error("No authentication token received");
      }
    } catch (error) {
      if (error?.response?.data?.unconfirmed) {
        navigate(`/email_confirmation?email=${values.email}`);
        toast.error(error.response.data.error);
      } else if (error?.response?.data?.error) {
        setFieldError("password", error.response.data.error);
        toast.error(error.response.data.error);
      } else {
        toast.error("Login failed. Please try again.");
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-8 text-neutral-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="absolute right-4 top-4">
        <AuthThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8 dark:border-white/10 dark:bg-slate-800/90">
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
            Sign in
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Continue to your workspace.
          </p>
        </div>
        <div>
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
                    />
                    <InputErrors
                      fieldErrors={errors.password}
                      fieldTouched={touched.password}
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                        isBtnDisabled(values)
                          ? "cursor-not-allowed border-transparent bg-neutral-300 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
                          : "cursor-pointer border-black/10 bg-neutral-900 text-white hover:bg-neutral-800 dark:border-white/15 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                      }`}
                    >
                      Sign In
                    </button>
                  </div>
                  <div className="relative flex items-center py-5">
                    <div className="flex-grow border-t border-black/10 dark:border-white/10" />
                    <span className="mx-4 flex-shrink text-xs text-neutral-500 dark:text-neutral-500">
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
          <p className="mb-2 pt-6 text-center text-sm text-neutral-500 dark:text-slate-400">
            <span className="form__link inline cursor-pointer">
              <a href={Paths.FORGOT_PASSWORD}>
                <span className="inline-block text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white">
                  Forgot password?
                </span>
              </a>
            </span>
          </p>
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Don&apos;t have an account?{" "}
            <span className="inline cursor-pointer">
              <a href={Paths.SIGNUP}>
                <span className="inline-block text-black hover:text-neutral-700 dark:text-white dark:hover:text-neutral-200">
                  Sign up
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

export default SignInForm;
