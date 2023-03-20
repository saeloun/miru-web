import React from "react";

import { Formik, Form, FormikProps } from "formik";
import { MiruLogoSVG } from "miruIcons";
import { ToastContainer } from "react-toastify";

import authenticationApi from "apis/authentication";
import { InputErrors, InputField } from "common/FormikFields";
import { MIRU_APP_URL, Paths, TOASTER_DURATION } from "constants/index";

import {
  resetPasswordFormInitialValues,
  resetPasswordFormValidationSchema,
} from "./utils";

interface ResetPasswordFormValues {
  password: string;
  confirm_password: string;
}

const ResetPassword = () => {
  const searchParams = new URLSearchParams(document.location.search);

  const handleResetPasswordFormSubmit = async values => {
    const { password, confirm_password } = values;
    const payload = {
      reset_password_token: searchParams.get("reset_password_token"),
      password,
      password_confirmation: confirm_password,
    };
    const res = await authenticationApi.resetPassword(payload);
    if (res.status == 200) {
      setTimeout(() => {
        window.location.assign(`${window.location.origin}`);
      }, 500);
    }
  };

  const isSubmitBtnDisable = values =>
    !(values?.password?.trim() && values?.confirm_password?.trim());

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <div className="w-full px-8 pt-16 pb-4 md:px-0 md:pt-36">
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
            Reset Password
          </h1>
          <div className="pt-20">
            <Formik
              initialValues={resetPasswordFormInitialValues}
              validateOnBlur={false}
              validateOnChange={false}
              validationSchema={resetPasswordFormValidationSchema}
              onSubmit={handleResetPasswordFormSubmit}
            >
              {(props: FormikProps<ResetPasswordFormValues>) => {
                const {
                  values,
                  touched,
                  errors,
                  setFieldError,
                  setFieldValue,
                } = props;

                return (
                  <Form>
                    <div className="field">
                      <InputField
                        id="password"
                        label="Password"
                        labelClassName="p-0"
                        name="password"
                        type="password"
                        inputBoxClassName={`p-3.75 ${
                          errors.password && touched.password
                            ? "error-input border-miru-red-400"
                            : ""
                        }`}
                        onChange={e => {
                          if (errors.password && touched.password) {
                            setFieldError("password", "");
                          }
                          setFieldValue("password", e.target.value);
                        }}
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
                        type="password"
                        inputBoxClassName={`p-3.75 ${
                          errors.confirm_password && touched.confirm_password
                            ? "error-input border-miru-red-400"
                            : ""
                        }`}
                        onChange={e => {
                          if (
                            errors.confirm_password &&
                            touched.confirm_password
                          ) {
                            setFieldError("confirm_password", "");
                          }
                          setFieldValue("confirm_password", e.target.value);
                        }}
                      />
                      <InputErrors
                        fieldErrors={errors.confirm_password}
                        fieldTouched={touched.confirm_password}
                      />
                    </div>
                    <div>
                      <button
                        data-cy="reset-password-button"
                        type="submit"
                        className={`form__button whitespace-nowrap ${
                          isSubmitBtnDisable(values)
                            ? "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
                            : "cursor-pointer"
                        }`}
                      >
                        Reset password
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

export default ResetPassword;
