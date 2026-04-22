import { MIRU_APP_URL, Paths } from "constants/index";

import React, { useEffect, useState } from "react";

import { authenticationApi } from "apis/api";
import { InputErrors, InputField } from "common/FormikFields";
import MiruLogoWatermark from "common/MiruLogoWatermark";
import useThemeMode from "common/useThemeMode";
import { Form, Formik, FormikProps } from "formik";
import { MiruLogoWithTextSVG } from "miruIcons";

import { i18n } from "../../../i18n";
import PasswordResetLinkSentMsg from "./PasswordResetLinkSentMsg";
import {
  forgotPasswordFormInitialValues,
  forgotPasswordFormValidationSchema,
} from "./utils";

interface ForgotPasswordFormValues {
  email: string;
}

const ForgotPassword = () => {
  const themeMode = useThemeMode();
  const [emailToSendResetPasswordLink, setEmailToSendResetPasswordLink] =
    useState<string>("");

  useEffect(() => {
    setEmailToSendResetPasswordLink("");
  }, []);

  const handlePasswordFormSubmit = async (values, { setFieldError }) => {
    const email = values?.email?.trim();
    try {
      if (email) {
        await authenticationApi.forgotPassword({ email });
        setEmailToSendResetPasswordLink(email);
      }
    } catch (error) {
      setFieldError("email", error.response.data.error);
    }
  };

  if (emailToSendResetPasswordLink) {
    return <PasswordResetLinkSentMsg email={emailToSendResetPasswordLink} />;
  }

  return (
    <div className="relative min-h-screen w-full bg-background px-8 pb-4 pt-10 text-foreground md:px-0 md:pt-36">
      <div className="mx-auto min-h-full md:w-1/2 lg:w-352">
        <div>
          <a href={MIRU_APP_URL} rel="noreferrer noopener">
            <img
              alt={i18n.t("auth.miruLogo")}
              className="d-block mx-auto mb-4 h-10 w-auto object-contain md:mb-10 lg:mb-20"
              src={MiruLogoWithTextSVG}
              style={{
                filter:
                  themeMode === "dark" ? "brightness(0) invert(1)" : "none",
              }}
            />
          </a>
        </div>
        <h1 className="text-center font-geist text-2xl font-extrabold text-foreground md:text-3xl lg:text-4.5xl">
          {i18n.t("auth.forgotPassword")}
        </h1>
        <div className="pt-10 lg:pt-20">
          <Formik
            initialValues={forgotPasswordFormInitialValues}
            validateOnBlur={false}
            validateOnChange={false}
            validationSchema={forgotPasswordFormValidationSchema}
            onSubmit={handlePasswordFormSubmit}
          >
            {(props: FormikProps<ForgotPasswordFormValues>) => {
              const { values, touched, errors, setFieldValue, setFieldError } =
                props;

              return (
                <Form>
                  <div className="field relative">
                    <InputField
                      hasError={errors.email && touched.email}
                      id="email"
                      label={i18n.t("auth.enterRegisteredEmail")}
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
                  <div>
                    <button
                      type="submit"
                      className={`form__button whitespace-nowrap ${
                        !values?.email?.trim()
                          ? "cursor-not-allowed border-transparent bg-muted text-foreground/70 hover:border-transparent"
                          : "cursor-pointer"
                      }`}
                    >
                      {i18n.t("auth.sendResetLink")}
                    </button>
                  </div>
                  <p className="mb-3 mt-3 text-center font-geist text-xs font-normal not-italic text-foreground">
                    <span className="form__link inline cursor-pointer">
                      <a href={Paths.LOGIN}>
                        <span className="mr-2 inline-block font-bold">
                          {i18n.t("auth.backToLogin")}
                        </span>
                      </a>
                    </span>
                  </p>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
      <MiruLogoWatermark />
    </div>
  );
};

export default ForgotPassword;
