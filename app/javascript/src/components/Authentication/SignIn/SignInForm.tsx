import React, { useState } from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import { GoogleSVG, PasswordIconSVG, PasswordIconTextSVG } from "miruIcons";
import { ToastContainer } from "react-toastify";

import authenticationApi from "apis/authentication";
import Toastr from "common/Toastr";
import { Paths, TOASTER_DURATION } from "constants/index";
import { useAuthDispatch } from "context/auth";

import { signInFormInitialValues, signInFormValidationSchema } from "./utils";

import FooterLinks from "../FooterLinks";

interface SignInFormValues {
  email: string;
  password: string;
}

const SignInForm = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const authDispatch = useAuthDispatch();

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
      Toastr.info(res);
      setTimeout(() => {
        window.location.assign(`${window.location.origin}`);
      }, 500);
    } catch (error) {
      Toastr.error(error);
      if (error.response.data.unconfirmed) {
        setTimeout(
          () =>
            (window.location.href = `/email_confirmation?email=${values.email}`),
          500
        );
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
                      <div className="outline relative">
                        <Field
                          autoFocus
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
                          htmlFor="Name"
                          className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium
                          text-miru-dark-purple-200 duration-300"
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
                    </div>
                    <div className="mb-6 block text-xs tracking-wider text-red-600">
                      {errors.password && touched.password && (
                        <div>{errors.password}</div>
                      )}
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
            <div className="mb-3">
              <button
                className="form__button whitespace-nowrap"
                data-cy="sign-up-button"
                onClick={authenticationApi.googleAuth}
              >
                <img alt="" className="mr-2" src={GoogleSVG} />
                Sign In with Google
              </button>
            </div>
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
