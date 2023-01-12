import React, { useState } from "react";

import { Formik, Form, Field, FormikProps } from "formik";

import signInApi from "apis/sign-in";

import { signInFormInitialValues, signInFormValidationSchema } from "./utils";

import { Paths } from "../../../constants";

const password_icon = require("../../../../../assets/images/password_icon.svg"); // eslint-disable-line
const password_icon_text = require("../../../../../assets/images/password_icon_text.svg"); // eslint-disable-line

interface SignInFormValues {
  email: string;
  password: string;
}

const SignInForm = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSignInFormSubmit = async (values: any) => {
    const signInResponse = await signInApi.post(values); // eslint-disable-line
  };

  return (
    <div className="w-full px-8 pt-16 pb-4 md:w-1/2 md:px-0 md:pt-36">
      <div className="mx-auto min-h-full md:w-1/2 lg:w-352">
        <h1 className="text-center font-manrope text-4xl font-extrabold text-miru-han-purple-1000">
          Welcome back!
        </h1>
        <div className="pt-20">
          <Formik
            initialValues={signInFormInitialValues}
            validateOnBlur={false}
            validationSchema={signInFormValidationSchema}
            onSubmit={handleSignInFormSubmit}
          >
            {(props: FormikProps<SignInFormValues>) => {
              const { touched, errors } = props;

              return (
                <Form>
                  {/* Email */}
                  <div className="mb-3">
                    <div className="field_with_errors">
                      <label className="form__label">Email</label>
                    </div>
                    <Field
                      data-cy="sign-up-email"
                      label="Email"
                      name="email"
                      className={`form__input border-miru-gray-1000 bg-transparent ${
                        errors.email &&
                        touched.email &&
                        "border-red-600 focus:border-red-600 focus:ring-red-600"
                      } `}
                    />
                    <div className="text-xs tracking-wider text-red-600">
                      {errors.email && touched.email && <p>{errors.email}</p>}
                    </div>
                  </div>
                  {/* Password */}
                  <div className="mb-3">
                    <div className="field_with_errors">
                      <label className="form__label">Password</label>
                    </div>
                    <div className="relative">
                      <Field
                        data-cy="sign-in-password"
                        label="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        className={`form__input border-miru-gray-1000 bg-transparent ${
                          errors.password &&
                          touched.password &&
                          "border-red-600 focus:border-red-600 focus:ring-red-600"
                        } `}
                      />
                      <span
                        className="absolute right-2 top-1/4 z-10 cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {!showPassword ? (
                          <img
                            alt="pass_icon"
                            height="12"
                            src={password_icon}
                            width="12"
                          />
                        ) : (
                          <img
                            alt="pass_icon_text"
                            height="12"
                            src={password_icon_text}
                            width="12"
                          />
                        )}
                      </span>
                    </div>
                    <div className="text-xs tracking-wider text-red-600">
                      {errors.password && touched.password && (
                        <p>{errors.password}</p>
                      )}
                    </div>
                  </div>
                  {/* Sign In Button */}
                  <div className="mb-3">
                    <button
                      className="form__button whitespace-nowrap"
                      data-cy="sign-up-button"
                      type="submit"
                    >
                      Sign In
                    </button>
                  </div>
                  {/* OR seperator */}
                  <div className="relative mb-3 flex items-center py-5">
                    <div className="flex-grow border-t border-miru-gray-1000" />
                    <span className="mx-4 flex-shrink text-xs text-miru-dark-purple-1000">
                      or
                    </span>
                    <div className="flex-grow border-t border-miru-gray-1000" />
                  </div>
                  {/* Sign In with Google */}
                  <div className="mb-3">
                    <button
                      className="form__button whitespace-nowrap"
                      data-cy="sign-up-button"
                    >
                      Sign In with Google
                    </button>
                  </div>
                  {/* Sign In with Apple */}
                  <div className="mb-3">
                    <button
                      className="form__button whitespace-nowrap"
                      data-cy="sign-up-button"
                    >
                      Sign In with Apple
                    </button>
                  </div>
                  {/* Forgot Password */}
                  <p className="mb-3 text-center font-manrope text-xs font-normal not-italic text-miru-dark-purple-1000">
                    <span
                      className="form__link inline cursor-pointer"
                      data-cy="sign-in-link"
                    >
                      <a href={Paths.SIGN_IN}>
                        <span className="mr-2 inline-block">
                          Forgot Password?
                        </span>
                      </a>
                    </span>
                  </p>
                  {/* Don't have an account? */}
                  <p className="text-center font-manrope text-xs font-normal not-italic text-miru-dark-purple-1000">
                    Don't have an account?&nbsp;
                    <span
                      className="form__link inline cursor-pointer"
                      data-cy="sign-in-link"
                    >
                      <a href={Paths.SIGN_UP}>
                        <span className="mr-2 inline-block">Sign Up</span>
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
  );
};

export default SignInForm;
