import React from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import { Square, CheckSquare } from "phosphor-react";

import { signUpFormInitialValues, signUpFormValidationSchema } from "./utils";

import { Paths } from "../../../constants";

interface SignUpFormValues {
  firstName: string;
  lastName: string;
  email: string;
  isAgreedTermsOfServices: boolean;
}

const SignUpForm = () => {
  const handleSignUpFormSubmit = () => {
    // eslint-disable-line @typescript-eslint/no-empty-function
  };

  return (
    <div className="w-full px-8 pt-16 pb-4 md:w-1/2 md:px-0 md:pt-36">
      <div className="mx-auto min-h-full md:w-1/2 lg:w-352">
        <h1 className="text-center font-manrope text-4xl font-extrabold text-miru-han-purple-1000">
          Signup for Miru
        </h1>
        <div className="pt-20">
          <Formik
            initialValues={signUpFormInitialValues}
            validateOnBlur={false}
            validationSchema={signUpFormValidationSchema}
            onSubmit={handleSignUpFormSubmit}
          >
            {(props: FormikProps<SignUpFormValues>) => {
              const { touched, errors, values, setFieldValue } = props;

              return (
                <Form>
                  <div className="mb-3 flex justify-between">
                    {/* <div className="floating-input">
                      <div className="material-textfield">
                        <input placeholder="label" type="text" />
                        <label> label</label>
                      </div>
                    </div> */}
                    {/* Fisrt name */}
                    <div className="w-5/12 lg:w-168">
                      <div className="field_with_errors">
                        <label className="form__label">First name</label>
                      </div>
                      <Field
                        data-cy="sign-up-firstName"
                        label="First Name"
                        name="firstName"
                        className={`form__input border-miru-gray-1000 bg-transparent px-4 py-3 ${
                          errors.firstName &&
                          touched.firstName &&
                          "border-red-600 focus:border-red-600 focus:ring-red-600"
                        } `}
                      />
                      <div className="text-xs tracking-wider text-red-600">
                        {errors.firstName && touched.firstName && (
                          <p>{errors.firstName}</p>
                        )}
                      </div>
                    </div>
                    {/* Last name */}
                    <div className="w-5/12 lg:w-168">
                      <div className="field_with_errors">
                        <label className="form__label">Last name</label>
                      </div>
                      <Field
                        data-cy="sign-up-lastName"
                        label="Last Name"
                        name="lastName"
                        className={`form__input border-miru-gray-1000 bg-transparent px-4 py-3 ${
                          errors.lastName &&
                          touched.lastName &&
                          "border-red-600 focus:border-red-600 focus:ring-red-600"
                        } `}
                      />
                      <div className="text-xs tracking-wider text-red-600">
                        {errors.lastName && touched.lastName && (
                          <p>{errors.lastName}</p>
                        )}
                      </div>
                    </div>
                  </div>
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
                  {/* Privacy Policy Checkbox */}
                  <div className="mb-3 mt-7 flex text-xs font-normal leading-4 text-miru-dark-purple-1000">
                    <div className="mt-2 flex">
                      {values.isAgreedTermsOfServices ? (
                        <CheckSquare
                          className="mr-3 cursor-pointer text-miru-han-purple-1000"
                          size={16}
                          weight="bold"
                          onClick={() => {
                            setFieldValue("isAgreedTermsOfServices", false);
                          }}
                        />
                      ) : (
                        <Square
                          className="mr-3 cursor-pointer text-miru-han-purple-1000"
                          size={16}
                          weight="bold"
                          onClick={() => {
                            setFieldValue("isAgreedTermsOfServices", true);
                          }}
                        />
                      )}
                      <h4>
                        I agree to the&nbsp;
                        <span className="form__link cursor-pointer">
                          Terms of Service&nbsp;
                        </span>
                        and&nbsp;
                        <span className="form__link cursor-pointer">
                          Privacy Policy
                        </span>
                      </h4>
                    </div>
                  </div>
                  {/* Sign Up Button */}
                  <div className="mb-3">
                    <button
                      className="form__button whitespace-nowrap"
                      data-cy="sign-up-button"
                      type="submit"
                    >
                      Sign Up
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
                  {/* Sign Up with Google */}
                  <div className="mb-3">
                    <button
                      className="form__button whitespace-nowrap"
                      data-cy="sign-up-button"
                    >
                      Sign Up with Google
                    </button>
                  </div>
                  {/* Sign Up with Apple */}
                  <div className="mb-3">
                    <button
                      className="form__button whitespace-nowrap"
                      data-cy="sign-up-button"
                    >
                      Sign Up with Apple
                    </button>
                  </div>
                  <p className="text-center font-manrope text-xs font-normal not-italic text-miru-dark-purple-1000">
                    Already have an account?&nbsp;
                    <span
                      className="form__link inline cursor-pointer"
                      data-cy="sign-in-link"
                    >
                      <a href={Paths.SIGN_IN}>
                        <span className="mr-2 inline-block">Sign In</span>
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

export default SignUpForm;
