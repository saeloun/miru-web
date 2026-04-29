import { MIRU_APP_URL, Paths } from "constants/index";

import React from "react";

import { authenticationApi } from "apis/api";
import { InputErrors, InputField } from "common/FormikFields";
import MiruLogoWatermark from "common/MiruLogoWatermark";
import useThemeMode from "common/useThemeMode";
import { Formik, Form, FormikProps } from "formik";
import { MiruLogoWithTextSVG } from "miruIcons";
import { setToLocalStorage } from "utils/storage";

import { i18n } from "../../../i18n";
import {
  resetPasswordFormInitialValues,
  resetPasswordFormValidationSchema,
} from "./utils";

interface ResetPasswordFormValues {
  password: string;
  confirm_password: string;
}

const ResetPassword = () => {
  const themeMode = useThemeMode();
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
      if (res.status === 200) {
        setToLocalStorage("authToken", res.data.user.token);
        setToLocalStorage("authEmail", res.data.user.email);
        setTimeout(() => {
          window.location.assign(`${window.location.origin}`);
        }, 500);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "An unexpected error occurred";
      setFieldError("confirm_password", errorMessage);
    }
  };

  const isSubmitBtnDisable = values =>
    !(values?.password?.trim() && values?.confirm_password?.trim());

  return (
    <div className="relative min-h-screen w-full bg-background px-8 pb-4 pt-10 text-foreground md:px-0 md:pt-36">
      <div className="mx-auto min-h-full md:w-1/2 lg:w-352">
        <div>
          <a href={MIRU_APP_URL} rel="noreferrer noopener">
            <img
              alt={i18n.t("auth.miruLogo")}
              className="d-block mx-auto mb-4 h-10 w-auto object-contain md:mb-10 lg:mb-20"
              src={MiruLogoWithTextSVG}
              style={{
                filter:
                  themeMode === "dark" ? "brightness(0) invert(1)" : "none",
              }}
            />
          </a>
        </div>
        <h1 className="text-center font-geist text-2xl font-extrabold text-foreground md:text-3xl lg:text-4.5xl">
          {i18n.t("auth.resetPassword")}
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
              const { values, touched, errors, setFieldError, setFieldValue } =
                props;

              return (
                <Form>
                  <div className="field">
                    <InputField
                      hasError={errors.password && touched.password}
                      id="password"
                      label={i18n.t("auth.password")}
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
                      label={i18n.t("auth.confirmPassword")}
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
                      disabled={isSubmitBtnDisable(values)}
                      className={`form__button whitespace-nowrap ${
                        isSubmitBtnDisable(values)
                          ? "cursor-not-allowed border-transparent bg-muted text-foreground/70 hover:border-transparent"
                          : "cursor-pointer"
                      }`}
                    >
                      {i18n.t("auth.resetPassword")}
                    </button>
                  </div>
                  <p className="mb-3 mt-3 text-center font-geist text-xs font-normal not-italic text-foreground">
                    <span className="form__link inline cursor-pointer">
                      <a href={Paths.LOGIN}>
                        <span className="mr-2 inline-block">
                          {i18n.t("auth.backToLogin")}
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
  );
};

export default ResetPassword;
