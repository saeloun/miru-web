import * as Yup from "yup";
import { i18n } from "../../../i18n";

export const employmentSchema = {
  current_employment: Yup.object().shape({
    employee_id: Yup.string()
      .required(i18n.t("employment.validation.employeeIdRequired"))
      .typeError(i18n.t("employment.validation.employeeIdRequired"))
      .max(20, i18n.t("employment.validation.max20")),
    employment_type: Yup.string()
      .typeError(i18n.t("employment.validation.employmentTypeRequired"))
      .required(i18n.t("employment.validation.employmentTypeRequired")),
    designation: Yup.string()
      .required(i18n.t("employment.validation.designationRequired"))
      .typeError(i18n.t("employment.validation.designationRequired"))
      .max(40, i18n.t("employment.validation.max40")),
    email: Yup.string()
      .required(i18n.t("employment.validation.emailRequired"))
      .email(i18n.t("auth.validation.validEmailPrompt"))
      .typeError(i18n.t("employment.validation.emailRequired")),
    joined_at: Yup.string()
      .required(i18n.t("employment.validation.dateOfJoiningRequired"))
      .typeError(i18n.t("employment.validation.dateOfJoiningRequired")),
  }),
  previous_employment: Yup.array(),
};
