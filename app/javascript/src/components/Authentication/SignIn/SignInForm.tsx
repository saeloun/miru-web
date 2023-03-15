import React from "react";

import { Formik, Form, FormikProps } from "formik";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import authenticationApi from "apis/authentication";
import { InputErrors, InputField } from "common/FormikFields";
import { Paths, TOASTER_DURATION } from "constants/index";
import { useAuthDispatch } from "context/auth";

import { signInFormInitialValues, signInFormValidationSchema } from "./utils";

import FooterLinks from "../FooterLinks";

interface SignInFormValues {
  email: string;
  password: string;
}

const SignInForm = () => {
  const authDispatch = useAuthDispatch();
  const navigate = useNavigate();

  const handleSignInFormSubmit = async (values: any) => {
    try {
      const res = await authenticationApi.signin(values);
      //@ts-expect-error for authDispatch initial values
      authDispatch({
        type: "LOGIN",
        payload: {
          token: res.data.user.token,
          email: res?.data?.user.email,
        },
      });

      setTimeout(
        () => (window.location.href = `${window.location.origin}`),
        500
      );
    } catch (error) {
      if (error.response.data.unconfirmed) {
        navigate(`/email_confirmation?email=${values.email}`);
      }
    }
  };

  const isBtnDisabled = (values: SignInFormValues) =>
    !(values.email?.trim() && values?.password?.trim());

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <div className="relative w-full px-8 pt-16 pb-4 md:px-0 md:pt-36 lg:w-1/2">
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
                const { touched, errors, values } = props;

                return (
                  <Form>
                    <div className="field relative">
                      <InputField
                        autoFocus
                        id="email"
                        label="Email"
                        name="email"
                      />
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
                    <div>
                      <button
                        data-cy="sign-up-button"
                        type="submit"
                        className={`form__button whitespace-nowrap ${
                          isBtnDisabled(values)
                            ? "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
                            : "cursor-pointer"
                        }`}
                      >
                        Sign In
                      </button>
                    </div>
                    <div className="relative flex items-center py-7">
                      <div className="flex-grow border-t border-miru-gray-1000" />
                      <span className="mx-4 flex-shrink text-xs text-miru-dark-purple-1000">
                        or
                      </span>
                      <div className="flex-grow border-t border-miru-gray-1000" />
                    </div>
                  </Form>
                );
              }}
            </Formik>
            {/* <div className="mb-3">
              <button
                className="form__button whitespace-nowrap"
                data-cy="sign-up-button"
                onClick={authenticationApi.googleAuth}
              >
                <img alt="" className="mr-2" src={GoogleSVG} />
                Sign In with Google
              </button>
            </div> */}
            <p className="mb-3 text-center font-manrope text-xs font-normal not-italic text-miru-dark-purple-1000">
              <span
                className="form__link inline cursor-pointer"
                data-cy="sign-in-link"
              >
                <a href={Paths.FORGOT_PASSWORD}>
                  <span className="mr-2 inline-block">Forgot Password?</span>
                </a>
              </span>
            </p>
            <p className="text-center font-manrope text-xs font-normal not-italic text-miru-dark-purple-1000">
              Don't have an account?&nbsp;
              <span
                className="form__link inline cursor-pointer"
                data-cy="sign-in-link"
              >
                <a href={Paths.SIGNUP}>
                  <span className="mr-2 inline-block">Sign Up</span>
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

export default SignInForm;
