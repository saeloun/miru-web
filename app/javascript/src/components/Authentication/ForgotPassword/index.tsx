import React, { useEffect, useState } from "react";

import { Field, Form, Formik, FormikProps } from "formik";
import { MiruLogoSVG } from "miruIcons";
import { ToastContainer } from "react-toastify";

import authenticationApi from "apis/authentication";
import { registerIntercepts, setAuthHeaders } from "apis/axios";
import { Paths, TOASTER_DURATION } from "constants/index";

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
    setAuthHeaders();
    registerIntercepts();
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
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <div className="w-full px-8 pt-16 pb-4 md:px-0 md:pt-36">
        <div className="mx-auto min-h-full md:w-1/2 lg:w-352">
          <div>
            <img
              alt="miru-logo"
              className="d-block mx-auto mb-20"
              height="64"
              src={MiruLogoSVG}
              width="64"
            />
          </div>
          <h1 className="text-center font-manrope text-4xl font-extrabold text-miru-han-purple-1000">
            Forgot Password
          </h1>
          <div className="pt-20">
            <Formik
              initialValues={forgotPasswordFormInitialValues}
              validateOnBlur={false}
              validationSchema={forgotPasswordFormValidationSchema}
              onSubmit={handlePasswordFormSubmit}
            >
              {(props: FormikProps<ForgotPasswordFormValues>) => {
                const { touched, errors } = props;

                return (
                  <Form>
                    <div className="field relative">
                      <div className="outline relative">
                        <Field
                          name="email"
                          placeholder=" "
                          className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                            errors.email &&
                            touched.email &&
                            "border-red-600 focus:border-red-600 focus:ring-red-600"
                          } `}
                        />
                        <label
                          className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                          htmlFor="Name"
                        >
                          Enter your registered email ID
                        </label>
                      </div>
                      <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                        {errors.email && touched.email && (
                          <div>{errors.email}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <button
                        className="form__button whitespace-nowrap"
                        data-cy="sign-up-button"
                        type="submit"
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
                          <span className="mr-2 inline-block">
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
      </div>
    </>
  );
};

export default ForgotPassword;
