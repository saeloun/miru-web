# frozen_string_literal: true

json.data do
  json.user do
    json.email params[:email]
  end
  json.notice "You are logged in."
end
