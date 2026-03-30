import * as Yup from "yup";
import { t } from "../../../i18n";

export const signInFormInitialValues = {
  email: "",
  password: "",
};

export const buildSignInFormValidationSchema = () =>
  Yup.object().shape({
    email: Yup.string()
      .email(t("auth.validation.invalidEmail"))
      .required(t("auth.validation.emailRequired")),
    password: Yup.string().required(t("auth.validation.passwordRequired")),
  });
