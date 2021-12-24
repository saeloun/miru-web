# frozen_string_literal: true

json.user do
  json.call(
    @user,
    :email
  )
  json.notice "You have logged in."
end
