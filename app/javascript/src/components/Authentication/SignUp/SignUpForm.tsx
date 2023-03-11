import React from "react";

import { Formik, Form, FormikProps } from "formik";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import authenticationApi from "apis/authentication";
import { InputErrors, InputField } from "common/FormikFields";
import { Paths, TOASTER_DURATION } from "constants/index";

import { signUpFormInitialValues, signUpFormValidationSchema } from "./utils";

import FooterLinks from "../FooterLinks";

interface SignUpFormValues {
  firstName: string;
  lastName: string;
  email: string;
  isAgreedTermsOfServices: boolean;
  password: string;
  confirm_password: string;
}

const SignUpForm = () => {
  const navigate = useNavigate();

  const handleSignUpFormSubmit = async (values: any) => {
    const { firstName, lastName, email, password, confirm_password } = values;
    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      password_confirmation: confirm_password,
    };
    const res = await authenticationApi.signup(payload);
    navigate(`/email_confirmation?email=${res.data.email}`);
  };

  const isBtnDisabled = (values: SignUpFormValues) =>
    !(
      values?.firstName?.trim() &&
      values?.lastName?.trim() &&
      values.email?.trim() &&
      values?.password?.trim() &&
      values?.confirm_password?.trim() &&
      values?.password?.trim() == values?.confirm_password?.trim()
    );

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
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
                const { touched, errors, values } = props;

                return (
                  <Form>
                    <div className="mb-3 flex justify-between">
                      <div className="field relative mr-6 w-1/2 lg:w-168">
                        <InputField
                          id="firstName"
                          label="First Name"
                          name="firstName"
                        />
                        <InputErrors
                          fieldErrors={errors.firstName}
                          fieldTouched={touched.firstName}
                        />
                      </div>
                      <div className="field relative w-1/2 lg:w-168">
                        <InputField
                          id="lastName"
                          label="Last Name"
                          name="lastName"
                        />
                        <InputErrors
                          fieldErrors={errors.lastName}
                          fieldTouched={touched.lastName}
                        />
                      </div>
                    </div>
                    <div className="field relative">
                      <InputField id="email" label="Email" name="email" />
                      <InputErrors
                        fieldErrors={errors.email}
                        fieldTouched={touched.email}
                      />
                    </div>
                    <div className="field">
                      <InputField
                        id="password"
                        label="Password"
                        name="password"
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
                        name="confirm_password"
                        type="password"
                      />
                      <InputErrors
                        fieldErrors={errors.confirm_password}
                        fieldTouched={touched.confirm_password}
                      />
                    </div>
                    <div className="mb-3">
                      <button
                        data-cy="sign-up-button"
                        type="submit"
                        className={`form__button whitespace-nowrap ${
                          isBtnDisabled(values)
                            ? "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
                            : "cursor-pointer"
                        }`}
                      >
                        Sign Up
                      </button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
            <div className="relative mb-3 flex items-center py-5">
              <div className="flex-grow border-t border-miru-gray-1000" />
              <span className="mx-4 flex-shrink text-xs text-miru-dark-purple-1000">
                or
              </span>
              <div className="flex-grow border-t border-miru-gray-1000" />
            </div>
            {/* <div className="mb-3">
              <button
                className="form__button whitespace-nowrap"
                data-cy="sign-up-button"
                onClick={authenticationApi.googleAuth}
              >
                <img alt="" className="mr-2" src={GoogleSVG} />
                Sign Up with Google
              </button>
            </div> */}
            <p className="text-center font-manrope text-xs font-normal not-italic text-miru-dark-purple-1000">
              Already have an account?&nbsp;
              <span
                className="form__link inline cursor-pointer"
                data-cy="sign-in-link"
              >
                <a href={Paths.LOGIN}>
                  <span className="mr-2 inline-block">Sign In</span>
                </a>
              </span>
            </p>
          </div>
          <FooterLinks />
        </div>
      </div>
    </>
  );
};

export default SignUpForm;
