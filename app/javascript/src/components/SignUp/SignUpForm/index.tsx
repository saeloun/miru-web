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
    <div className="w-full px-8 pt-16 pb-4 md:px-0 md:pt-36 lg:w-1/2">
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
                    {/* First Name */}
                    <div className="field relative mr-6 w-1/2 lg:w-168">
                      <div className="outline relative">
                        <Field
                          name="firstName"
                          placeholder=" "
                          className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                            errors.firstName &&
                            touched.firstName &&
                            "border-red-600 focus:border-red-600 focus:ring-red-600"
                          } `}
                        />
                        <label
                          className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                          htmlFor="Name"
                        >
                          First Name
                        </label>
                      </div>
                      <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                        {errors.firstName && touched.firstName && (
                          <div>{errors.firstName}</div>
                        )}
                      </div>
                    </div>
                    {/* Last Name */}
                    <div className="field relative w-1/2 lg:w-168">
                      <div className="outline relative">
                        <Field
                          data-cy="sign-up-lastName"
                          name="lastName"
                          placeholder=" "
                          className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                            errors.lastName &&
                            touched.lastName &&
                            "border-red-600 focus:border-red-600 focus:ring-red-600"
                          } `}
                        />
                        <label
                          className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                          htmlFor="Name"
                        >
                          Last Name
                        </label>
                      </div>
                      <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                        {errors.lastName && touched.lastName && (
                          <div>{errors.lastName}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Email */}
                  <div className="field relative">
                    <div className="outline relative">
                      <Field
                        data-cy="sign-up-email"
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
                        Email
                      </label>
                    </div>
                    <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                      {errors.email && touched.email && (
                        <div>{errors.email}</div>
                      )}
                    </div>
                  </div>
                  {/* Privacy Policy Checkbox */}
                  <div className="my-6 flex text-xs font-normal leading-4 text-miru-dark-purple-1000">
                    <div className="mt-2 flex">
                      {values.isAgreedTermsOfServices ? (
                        <CheckSquare
                          className="mr-2 cursor-pointer text-miru-han-purple-1000"
                          size={16}
                          weight="bold"
                          onClick={() => {
                            setFieldValue("isAgreedTermsOfServices", false);
                          }}
                        />
                      ) : (
                        <Square
                          className="mr-2 cursor-pointer text-miru-han-purple-1000"
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
