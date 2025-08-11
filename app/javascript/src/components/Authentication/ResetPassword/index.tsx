import { MIRU_APP_URL, Paths } from "constants/index";

import React from "react";

import authenticationApi from "apis/authentication";
import { InputErrors, InputField } from "common/FormikFields";
import MiruLogoWatermark from "common/MiruLogoWatermark";
import { Formik, Form, FormikProps } from "formik";
import { MiruLogoSVG } from "miruIcons";
import { ToastContainer } from "react-toastify";
import { setToLocalStorage } from "utils/storage";

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

  const handleResetPasswordFormSubmit = async (values, { setFieldError }) => {
    const { password, confirm_password } = values;
    const payload = {
      reset_password_token: searchParams.get("reset_password_token"),
      password,
      password_confirmation: confirm_password,
    };
    try {
      const res = await authenticationApi.resetPassword(payload);
      if (res.status == 200) {
        setToLocalStorage("authToken", res.data.user.token);
        setToLocalStorage("authEmail", res.data.user.email);
        setTimeout(() => {
          window.location.assign(`${window.location.origin}`);
        }, 500);
      }
    } catch (error) {
      setFieldError("confirm_password", error.response.data.error);
    }
  };

  const isSubmitBtnDisable = values =>
    !(values?.password?.trim() && values?.confirm_password?.trim());

  return (
    <>
      <ToastContainer />
      <div className="relative min-h-screen w-full px-8 pt-10 pb-4 md:px-0 md:pt-36">
        <div className="mx-auto min-h-full md:w-1/2 lg:w-352">
          <div>
            <a href={MIRU_APP_URL} rel="noreferrer noopener">
              <img
                alt="miru-logo"
                className="d-block mx-auto mb-4 h-10 w-10 md:mb-10 md:h-16 md:w-16 lg:mb-20"
                src={MiruLogoSVG}
              />
            </a>
          </div>
          <h1 className="text-center font-manrope text-2xl font-extrabold text-miru-han-purple-1000 md:text-3xl lg:text-4.5xl">
            Reset Password
          </h1>
          <div className="pt-10 lg:pt-20">
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
                    <div className="field">
                      <InputField
                        id="confirm_password"
                        label="Confirm Password"
                        labelClassName="p-0"
                        name="confirm_password"
                        setFieldError={setFieldError}
                        setFieldValue={setFieldValue}
                        type="password"
                        hasError={
                          errors.confirm_password && touched.confirm_password
                        }
                      />
                      <InputErrors
                        fieldErrors={errors.confirm_password}
                        fieldTouched={touched.confirm_password}
                      />
                    </div>
                    <div>
                      <button
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
                      <span className="form__link inline cursor-pointer">
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
        <MiruLogoWatermark />
      </div>
    </>
  );
};

export default ResetPassword;
