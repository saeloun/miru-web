import { Paths } from "constants/index";

import React, { useRef, useState } from "react";

import { authenticationApi, passkeysApi } from "apis/api";
import { InputErrors, InputField } from "common/FormikFields";
import { useAuthDispatch } from "context/auth";
import { Formik, Form, FormikProps } from "formik";
import { GithubIcon, GoogleSVG } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { dashboardUrl } from "utils/dashboardUrl";
import { beginPasskeyAuthentication } from "utils/passkeys";

import { signInFormInitialValues, signInFormValidationSchema } from "./utils";

import AuthShell from "../AuthShell";
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
  const githubOauth = useRef(null);
  const [isPasskeyPending, setIsPasskeyPending] = useState(false);
  const csrfToken =
    document.querySelector('[name="csrf-token"]')?.getAttribute("content") ||
    "";

  const completeLogin = ({ company, company_role, user }) => {
    if (!user?.token) {
      throw new Error("No authentication token received");
    }

    authDispatch({
      type: "LOGIN",
      payload: {
        token: user.token,
        email: user.email,
      },
    });

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("company_role", company_role || "");
    if (company) {
      localStorage.setItem("company", JSON.stringify(company));
    }

    toast.success("Welcome back!");
    setTimeout(() => {
      window.location.href = dashboardUrl(company_role);
    }, 500);
  };

  const handleSignInFormSubmit = async (values: any, { setFieldError }) => {
    try {
      const res = await authenticationApi.signin(values);

      if (res.data?.requires_passkey) {
        setIsPasskeyPending(true);
        toast.message("Complete passkey verification to finish signing in.");

        const credential = await beginPasskeyAuthentication(
          res.data.public_key
        );

        const passkeyResponse = await passkeysApi.authenticate({
          credential,
          pending_token: res.data.pending_token,
        });

        completeLogin(passkeyResponse.data);

        return;
      }

      completeLogin(res.data);
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
    } finally {
      setIsPasskeyPending(false);
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

  const handleGithubAuth = async () => {
    const githubForm = githubOauth?.current;

    if (githubForm) githubForm.submit();
  };

  const isBtnDisabled = (values: SignInFormValues) =>
    !(values.email?.trim() && values?.password?.trim());

  return (
    <AuthShell
      description="Track work, send invoices, and keep cash flow clear from one place."
      title="Sign in to your workspace"
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
                    />
                    <InputErrors
                      fieldErrors={errors.password}
                      fieldTouched={touched.password}
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        isBtnDisabled(values)
                          ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                          : "cursor-pointer border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                      disabled={isBtnDisabled(values) || isPasskeyPending}
                    >
                      {isPasskeyPending ? "Waiting for passkey..." : "Sign in"}
                    </button>
                  </div>
                </Form>
              );
            }}
          </Formik>
          <div className="mt-6">
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
          <p className="mb-2 pt-6 text-center text-sm text-muted-foreground">
            <span className="form__link inline cursor-pointer">
              <a href={Paths.FORGOT_PASSWORD}>
                <span className="inline-block text-foreground hover:text-primary">
                  Forgot password?
                </span>
              </a>
            </span>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <span className="inline cursor-pointer">
              <a href={Paths.SIGNUP}>
                <span className="inline-block text-foreground hover:text-primary">
                  Sign up
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

export default SignInForm;
