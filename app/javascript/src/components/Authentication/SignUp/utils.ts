import * as Yup from "yup";
import { t } from "../../../i18n";

export const signUpFormInitialValues = {
  first_name: "",
  last_name: "",
  email: "",
  isAgreedTermsOfServices: false,
  password: "",
  confirm_password: "",
};

export const buildSignUpFormValidationSchema = () =>
  Yup.object().shape({
    first_name: Yup.string()
      .matches(/^[A-Za-z ]*$/, t("auth.validation.firstNameInvalid"))
      .max(20, t("auth.validation.firstNameMax"))
      .required(t("auth.validation.firstNameRequired")),
    last_name: Yup.string()
      .matches(/^[A-Za-z ]*$/, t("auth.validation.lastNameInvalid"))
      .max(20, t("auth.validation.lastNameMax"))
      .required(t("auth.validation.lastNameRequired")),
    email: Yup.string()
      .email(t("auth.validation.invalidEmail"))
      .required(t("auth.validation.emailRequired")),
    password: Yup.string()
      .matches(/^\S.*\S$/, t("auth.validation.passwordSpace"))
      .matches(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_\W\s\x00-\x1F\x7F])[\S\s]{8,}$/, // eslint-disable-line
        t("auth.validation.passwordComplexity")
      )
      .required(t("auth.validation.passwordRequired")),
    confirm_password: Yup.string()
      .matches(/^\S.*\S$/, t("auth.validation.passwordSpace"))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_\w\s\x00-\x1F\x7F])[\S]{8,}$/, // eslint-disable-line
        t("auth.validation.passwordComplexity")
      )
      .oneOf(
        [Yup.ref("password"), null],
        t("auth.validation.passwordsMustMatch")
      )
      .required(t("auth.validation.confirmPasswordRequired")),
    isAgreedTermsOfServices: Yup.boolean().oneOf(
      [true],
      t("auth.validation.acceptTerms")
    ),
  });
