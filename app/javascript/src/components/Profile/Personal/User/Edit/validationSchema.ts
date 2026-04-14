import * as Yup from "yup";
import { i18n } from "../../../../../i18n";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const phoneDigitsWithinLimit = phoneNumber =>
  phoneNumber ? phoneNumber.replace(/\D/g, "").length <= 15 : true;

export const userSchema = {
  first_name: Yup.string()
    .required(i18n.t("auth.validation.firstNamePrompt"))
    .max(20, i18n.t("auth.validation.firstNameMax")),
  last_name: Yup.string()
    .required(i18n.t("auth.validation.lastNamePrompt"))
    .max(20, i18n.t("auth.validation.lastNameMax")),
  addresses: Yup.object().shape({
    address_line_1: Yup.string().required(
      i18n.t("auth.validation.addressLine1Prompt")
    ),
    country: Yup.string().required(i18n.t("auth.validation.countryPrompt")),
    state: Yup.string().required(i18n.t("auth.validation.statePrompt")),
    city: Yup.string().required(i18n.t("auth.validation.cityPrompt")),
    pin: Yup.string().required(i18n.t("auth.validation.zipcodePrompt")),
  }),
  is_email: Yup.boolean(),
  email_id: Yup.string()
    .nullable()
    .when("is_email", {
      is: true,
      then: Yup.string().email(i18n.t("auth.validation.validEmailPrompt")),
    }),
  date_of_birth: Yup.string()
    .nullable()
    .test(
      "not-in-future",
      i18n.t("auth.validation.dateOfBirthFuture"),
      (value, context) => {
        if (!value) return true;

        const dateFormat = context.parent?.date_format || "DD-MM-YYYY";
        const parsedDate = dayjs(value, dateFormat, true);

        return parsedDate.isValid() && !parsedDate.isAfter(dayjs(), "day");
      }
    ),
  phone_number: Yup.string()
    .nullable()
    .test(
      "phone-number-length",
      i18n.t("auth.validation.mobile15Digits"),
      value => phoneDigitsWithinLimit(value)
    ),
  changePassword: Yup.boolean(),
  password: Yup.string().when("changePassword", {
    is: true,
    then: Yup.string()
      .required(i18n.t("auth.validation.passwordPrompt"))
      .matches(/^\S.*\S$/, i18n.t("auth.validation.passwordSpace"))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s\x00-\x1F\x7F])[\S\s]{8,}$/, // eslint-disable-line
        i18n.t("auth.validation.passwordComplexityStrict")
      ),
  }),
  currentPassword: Yup.string().when("changePassword", {
    is: true,
    then: Yup.string().required(
      i18n.t("auth.validation.currentPasswordPrompt")
    ),
  }),

  confirmPassword: Yup.string().when("changePassword", {
    is: true,
    then: Yup.string()
      .matches(/^\S.*\S$/, i18n.t("auth.validation.passwordSpace"))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s\x00-\x1F\x7F])[\S\s]{8,}$/, // eslint-disable-line
        i18n.t("auth.validation.passwordComplexityStrict")
      )
      .oneOf(
        [Yup.ref("password"), null],
        i18n.t("auth.validation.passwordsMustMatch")
      ),
  }),
};
