import dayjs from "dayjs";

export const teamsMapper = (user, address) => ({
  first_name: user.first_name,
  last_name: user.last_name,
  date_of_birth:
    user.date_of_birth && dayjs(user.date_of_birth).format(user.date_format),
  phone_number: user.phone,
  email_id: user.personal_email_id,
  addresses: {
    address_type: address?.address_type,
    address_line_1: address?.address_line_1,
    address_line_2: address?.address_line_2,
    country: address?.country,
    state: address?.state,
    city: address?.city,
    pin: address?.pin,
  },
  linkedin: user.social_accounts.linkedin_url,
  github: user.social_accounts.github_url,
  date_format: user.date_format,
});

export const employmentMapper = (current, previous) => ({
  current_employment: {
    employee_id: current.employee_id,
    email_id: current.employee_id,
    employee_type: current.employee_type,
    designation: current.designation,
    date_of_joining: current.joined_at,
    date_of_resignation: current.resigned_at,
  },
  previous_employments: previous,
});
