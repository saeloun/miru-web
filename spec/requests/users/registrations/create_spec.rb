# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::RegistrationsController#create", type: :request do
  describe "after_inactive_sign_up_path_for" do
    before do
      user_params = {
        first_name: "First name",
        last_name: "Last name",
        email: "sam@example.com",
        password: "testing!@",
        password_confirmation: "testing!@"
      }
      send_request :post, user_registration_path, params: { user: user_params }
    end

    it "sets flash message to signed_up_but_unconfirmed and return new_user_session_path" do
      message = "A message with a confirmation link has been sent to your email address. " \
                "Please follow the link to activate your account."
      expect(flash[:notice]).to eq(message)
      expect(response).to redirect_to(new_user_session_path)
    end
  end
end
