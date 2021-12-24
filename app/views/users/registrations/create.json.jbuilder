# frozen_string_literal: true

json.user do
  json.call(
    @user,
    :first_name,
    :last_name,
    :email
  )
  json.notice "You have signed up successfully"
end
