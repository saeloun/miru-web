import * as Yup from "yup";

export const employmentSchema = {
  current_employment: Yup.object().shape({
    employee_id: Yup.string()
      .required("Please enter first name")
      .max(20, "Maximum 20 characters are allowed"),
    employee_type: Yup.string()
      .required("Please enter last name")
      .max(20, "Maximum 20 characters are allowed"),
    designation: Yup.string()
      .required("Please enter last name")
      .max(20, "Maximum 20 characters are allowed"),
    is_email: Yup.boolean(),
    email_id: Yup.string()
      .nullable()
      .when("is_email", {
        is: true,
        then: Yup.string().email("Please enter valid email"),
      }),
    date_of_joining: Yup.string().required("Please enter date of joining"),
    date_of_resignation: Yup.string().required("Please enter date of joining"),
  }),
  previous_employment: Yup.array(),
};
