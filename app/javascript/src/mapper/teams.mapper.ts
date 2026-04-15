import dayjs from "dayjs";

export const pickPrimaryAddress = addresses => {
  if (!Array.isArray(addresses) || addresses.length === 0) return null;

  return (
    addresses.find(address => address?.address_type === "current") ||
    addresses.find(
      address =>
        address?.address_line_1 ||
        address?.city ||
        address?.state ||
        address?.country ||
        address?.pin
    ) ||
    addresses[0]
  );
};

export const teamsMapper = (user, address) => ({
  id: user.id,
  first_name: user.first_name,
  last_name: user.last_name,
  locale: user.locale,
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
  linkedin: user.social_accounts?.linkedin_url,
  github: user.social_accounts?.github_url,
  date_format: user.date_format,
});

export const employmentMapper = (current, previous) => ({
  current_employment: {
    employee_id: current.employee_id,
    email: current.email,
    employment_type: current.employment_type,
    designation: current.designation,
    joined_at: current.joined_at,
    resigned_at: current.resigned_at,
  },
  previous_employments: previous,
});
