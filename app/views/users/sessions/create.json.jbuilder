# frozen_string_literal: true

json.data do
  json.user do
    json.email params[:email]
    json.message "You are logged in."
  end
end
