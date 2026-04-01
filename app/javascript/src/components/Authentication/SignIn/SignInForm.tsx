import { Paths } from "constants/index";

import React, { useRef, useState } from "react";

import { authenticationApi, passkeysApi, totpApi } from "apis/api";
import { InputErrors, InputField } from "common/FormikFields";
import { useAuthDispatch } from "context/auth";
import { useUserContext } from "context/UserContext";
import { Formik, Form, FormikProps } from "formik";
import { GithubIcon, GoogleSVG } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { dashboardUrl } from "utils/dashboardUrl";
import { beginPasskeyAuthentication } from "utils/passkeys";

import { t } from "../../../i18n";
import {
  buildSignInFormValidationSchema,
  signInFormInitialValues,
} from "./utils";

import AuthShell from "../AuthShell";
import PrivacyPolicyModal from "../SignUp/PrivacyPolicyModal";
import TermsOfServiceModal from "../SignUp/TermsOfServiceModal";

interface SignInFormValues {
  email: string;
  password: string;
}

const SignInForm = () => {
  const { locale } = useUserContext();
  const [privacyModal, setPrivacyModal] = useState(false);
  const [termsOfServiceModal, setTermsOfServiceModal] = useState(false);
  const authDispatch = useAuthDispatch();
  const navigate = useNavigate();

  const googleOauth = useRef(null);
  const githubOauth = useRef(null);
  const [isPasskeyPending, setIsPasskeyPending] = useState(false);
  const [isTotpPending, setIsTotpPending] = useState(false);
  const [totpPendingToken, setTotpPendingToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
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

    toast.success(t("auth.signIn.welcomeBack"));
    setTimeout(() => {
      window.location.href = dashboardUrl(company_role);
    }, 500);
  };

  const handleSignInFormSubmit = async (values: any, { setFieldError }) => {
    try {
      const res = await authenticationApi.signin(values);

      if (res.data?.requires_passkey) {
        setIsPasskeyPending(true);
        toast.message(t("auth.signIn.passkeyPrompt"));

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

      if (res.data?.requires_totp) {
        setTotpPendingToken(res.data.pending_token);
        setIsTotpPending(true);
        toast.message(t("auth.signIn.totpPrompt"));

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
        toast.error(t("auth.signIn.loginFailed"));
      }
    } finally {
      setIsPasskeyPending(false);
    }
  };

  const handleTotpVerification = async () => {
    try {
      const response = await totpApi.authenticate({
        pending_token: totpPendingToken,
        code: totpCode,
        recovery_code: recoveryCode,
      });

      completeLogin(response.data);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Invalid verification code.");
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
      description={t("auth.signIn.description")}
      title={t("auth.signIn.title")}
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
                  {t("auth.signIn.continueWithGoogle")}
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
                  {t("auth.signIn.continueWithGitHub")}
                </button>
              </Form>
            </div>
          )}
        </Formik>
        <div className="relative mb-6 flex items-center">
          <div className="flex-grow border-t border-border" />
          <span className="mx-4 flex-shrink text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t("auth.signIn.orUseEmail")}
          </span>
          <div className="flex-grow border-t border-border" />
        </div>
        <div>
          {isTotpPending && (
            <div className="mb-6 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-foreground">
                  {t("auth.signIn.totpTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("auth.signIn.totpDescription")}
                </p>
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="totp_code"
                >
                  {t("auth.signIn.totpCode")}
                </label>
                <input
                  id="totp_code"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground"
                  inputMode="numeric"
                  onChange={event => setTotpCode(event.target.value)}
                  placeholder="123456"
                  value={totpCode}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="recovery_code"
                >
                  {t("auth.signIn.recoveryCode")}
                </label>
                <input
                  id="recovery_code"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground"
                  onChange={event => setRecoveryCode(event.target.value)}
                  placeholder="ABCD-EFGH"
                  value={recoveryCode}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-transparent bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  disabled={!(totpCode.trim() || recoveryCode.trim())}
                  onClick={handleTotpVerification}
                >
                  {t("auth.signIn.verifyAndSignIn")}
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-accent"
                  onClick={() => {
                    setIsTotpPending(false);
                    setTotpPendingToken("");
                    setTotpCode("");
                    setRecoveryCode("");
                  }}
                >
                  {t("auth.signIn.back")}
                </button>
              </div>
            </div>
          )}
          <Formik
            key={locale}
            initialValues={signInFormInitialValues}
            validateOnBlur={false}
            validateOnChange={false}
            validationSchema={buildSignInFormValidationSchema()}
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
                      label={t("auth.signIn.email")}
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
                      label={t("auth.signIn.password")}
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
                      {isPasskeyPending
                        ? t("auth.signIn.waitingForPasskey")
                        : t("auth.signIn.submit")}
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
                  {t("auth.signIn.forgotPassword")}
                </span>
              </a>
            </span>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.signIn.noAccount")}{" "}
            <span className="inline cursor-pointer">
              <a href={Paths.SIGNUP}>
                <span className="inline-block text-foreground hover:text-primary">
                  {t("auth.signIn.signUp")}
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
              {t("auth.signIn.privacy")}
            </button>
            <span>•</span>
            <button
              className="hover:text-foreground"
              onClick={handleTermsOfService}
              type="button"
            >
              {t("auth.signIn.terms")}
            </button>
          </div>
        </div>
      </div>
    </AuthShell>
  );
};

export default SignInForm;
