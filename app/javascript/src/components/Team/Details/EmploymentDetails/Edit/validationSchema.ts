import * as Yup from "yup";

export const employmentSchema = {
  current_employment: Yup.object().shape({
    employee_id: Yup.string()
      .required("Please enter employee id")
      .max(20, "Maximum 20 characters are allowed"),
    employment_type: Yup.string().required("Please select employment type"),
    designation: Yup.string()
      .required("Please enter designation")
      .max(20, "Maximum 20 characters are allowed"),
    email: Yup.string()
      .email("Please enter valid email")
      .required("Please enter email"),
    joined_at: Yup.string(),
  }),
  previous_employment: Yup.array(),
};
