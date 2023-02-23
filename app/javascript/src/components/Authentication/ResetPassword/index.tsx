import React, { useEffect, useState } from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import Logger from "js-logger";
import { MiruLogoSVG, PasswordIconSVG, PasswordIconTextSVG } from "miruIcons";
import { ToastContainer } from "react-toastify";

import authenticationApi from "apis/authentication";
import { registerIntercepts, setAuthHeaders } from "apis/axios";
import { Paths, TOASTER_DURATION } from "constants/index";

import {
  resetPasswordFormInitialValues,
  resetPasswordFormValidationSchema,
} from "./utils";

interface ResetPasswordFormValues {
  password: string;
  confirm_password: string;
}

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const searchParams = new URLSearchParams(document.location.search);

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  const handleResetPasswordFormSubmit = async values => {
    const { password, confirm_password } = values;
    const payload = {
      reset_password_token: searchParams.get("reset_password_token"),
      password,
      password_confirmation: confirm_password,
    };
    try {
      const res = await authenticationApi.resetPassword(payload);
      if (res.status == 200) {
        window.location.assign(`${window.location.origin}`);
      }
    } catch (err) {
      Logger.error(err);
    }
  };

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
            Reset Password
          </h1>
          <div className="pt-20">
            <Formik
              initialValues={resetPasswordFormInitialValues}
              validateOnBlur={false}
              validationSchema={resetPasswordFormValidationSchema}
              onSubmit={handleResetPasswordFormSubmit}
            >
              {(props: FormikProps<ResetPasswordFormValues>) => {
                const { touched, errors } = props;

                return (
                  <Form>
                    <div className="field">
                      <div className="outline relative">
                        <Field
                          name="password"
                          placeholder=" "
                          type={showPassword ? "text" : "password"}
                          className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                            errors.password &&
                            touched.password &&
                            "border-red-600 focus:border-red-600 focus:ring-red-600"
                          } `}
                        />
                        <label
                          className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                          htmlFor="Name"
                        >
                          Password
                        </label>
                        <span
                          className="absolute right-2 top-1/3 z-10 cursor-pointer"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {!showPassword ? (
                            <img
                              alt="pass_icon"
                              height="12"
                              src={PasswordIconSVG}
                              width="12"
                            />
                          ) : (
                            <img
                              alt="pass_icon_text"
                              height="12"
                              src={PasswordIconTextSVG}
                              width="12"
                            />
                          )}
                        </span>
                      </div>
                      <div className="mb-6 block text-xs tracking-wider text-red-600">
                        {errors.password && touched.password && (
                          <div>{errors.password}</div>
                        )}
                      </div>
                    </div>
                    <div className="field">
                      <div className="outline relative">
                        <Field
                          name="confirm_password"
                          placeholder=" "
                          type={showPassword ? "text" : "password"}
                          className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                            errors.confirm_password &&
                            touched.confirm_password &&
                            "border-red-600 focus:border-red-600 focus:ring-red-600"
                          } `}
                        />
                        <label
                          className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                          htmlFor="Name"
                        >
                          Confirm Password
                        </label>
                        <span
                          className="absolute right-2 top-1/3 z-10 cursor-pointer"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {!showPassword ? (
                            <img
                              alt="pass_icon"
                              height="12"
                              src={PasswordIconSVG}
                              width="12"
                            />
                          ) : (
                            <img
                              alt="pass_icon_text"
                              height="12"
                              src={PasswordIconTextSVG}
                              width="12"
                            />
                          )}
                        </span>
                      </div>
                      <div className="mb-6 block text-xs tracking-wider text-red-600">
                        {errors.confirm_password &&
                          touched.confirm_password && (
                            <div>{errors.confirm_password}</div>
                          )}
                      </div>
                    </div>
                    <div>
                      <button
                        className="form__button whitespace-nowrap"
                        data-cy="sign-up-button"
                        type="submit"
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
