export const teamsMapper = (user, address) => ({
  first_name: user.first_name,
  last_name: user.last_name,
  date_of_birth: user.date_of_birth,
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
