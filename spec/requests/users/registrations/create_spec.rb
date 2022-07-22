# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::RegistrationsController#create", type: :request do
  describe "after_inactive_sign_up_path_for" do
    let(:email) { "sam@example.com" }

    before do
      user_params = {
        first_name: "First name",
        last_name: "Last name",
        email:,
        password: "testing!@",
        password_confirmation: "testing!@"
      }
      send_request :post, user_registration_path, params: { user: user_params }
    end

    it "sets flash message to signed_up_but_unconfirmed and return new_user_session_path" do
      expect(response).to redirect_to(email_confirmation_path({ email: }))
    end
  end
end
