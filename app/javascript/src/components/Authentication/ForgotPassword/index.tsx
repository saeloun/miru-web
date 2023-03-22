import React, { useEffect, useState } from "react";

import { Form, Formik, FormikProps } from "formik";
import { MiruLogoSVG } from "miruIcons";

import authenticationApi from "apis/authentication";
import { InputErrors, InputField } from "common/FormikFields";
import MiruLogoWatermark from "common/MiruLogoWatermark";
import { MIRU_APP_URL, Paths } from "constants/index";

import PasswordResetLinkSentMsg from "./PasswordResetLinkSentMsg";
import {
  forgotPasswordFormInitialValues,
  forgotPasswordFormValidationSchema,
} from "./utils";

interface ForgotPasswordFormValues {
  email: string;
}

const ForgotPassword = () => {
  const [emailToSendResetPasswordLink, setEmailToSendResetPasswordLink] =
    useState<string>("");

  useEffect(() => {
    setEmailToSendResetPasswordLink("");
  }, []);

  const handlePasswordFormSubmit = async values => {
    const email = values?.email?.trim();
    if (email) {
      await authenticationApi.forgotPassword({ email });
      setEmailToSendResetPasswordLink(email);
    }
  };

  if (emailToSendResetPasswordLink) {
    return <PasswordResetLinkSentMsg email={emailToSendResetPasswordLink} />;
  }

  return (
    <div className="relative min-h-screen w-full px-8 pt-16 pb-4 md:px-0 md:pt-36">
      <div className="mx-auto min-h-full md:w-1/2 lg:w-352">
        <div>
          <a href={MIRU_APP_URL} rel="noreferrer noopener">
            <img
              alt="miru-logo"
              className="d-block mx-auto mb-20"
              height="64"
              src={MiruLogoSVG}
              width="64"
            />
          </a>
        </div>
        <h1 className="text-center font-manrope text-4.5xl font-extrabold text-miru-han-purple-1000">
          Forgot Password
        </h1>
        <div className="pt-20">
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
                      label="Enter your registered email ID"
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
                      data-cy="send-password-reset-link-button"
                      type="submit"
                      className={`form__button whitespace-nowrap ${
                        !values?.email?.trim()
                          ? "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
                          : "cursor-pointer"
                      }`}
                    >
                      Send password reset link
                    </button>
                  </div>
                  <p className="mb-3 mt-3 text-center font-manrope text-xs font-normal not-italic text-miru-dark-purple-1000">
                    <span
                      className="form__link inline cursor-pointer"
                      data-cy="sign-in-link"
                    >
                      <a href={Paths.LOGIN}>
                        <span className="mr-2 inline-block font-bold">
                          Back to Login
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
