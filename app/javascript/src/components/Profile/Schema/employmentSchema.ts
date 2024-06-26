import * as Yup from "yup";

export const employmentSchema = {
  current_employment: Yup.object().shape({
    employee_id: Yup.string()
      .required("Please enter employee id")
      .typeError("Please enter employee id")
      .max(20, "Maximum 20 characters are allowed"),
    employment_type: Yup.string()
      .typeError("Please select employment type")
      .required("Please select employment type"),
    designation: Yup.string()
      .required("Please enter designation")
      .typeError("Please enter designation")
      .max(40, "Maximum 40 characters are allowed"),
    email: Yup.string()
      .required("Please enter email id")
      .email("Please enter valid email")
      .typeError("Please enter email"),
    joined_at: Yup.string()
      .required("Please enter Date of joining")
      .typeError("Please enter Date of joining"),
  }),
  previous_employment: Yup.array(),
};
