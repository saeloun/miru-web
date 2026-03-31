import * as Yup from "yup";
import { i18n } from "../../../i18n";
const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts);

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
