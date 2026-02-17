# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users::Confirmations#create", type: :request do
  let(:user) { create(:user) }

  describe "POST #create" do
    context "when user is not confirmed" do
      before do
        user.update(confirmed_at: nil)
      end

      it "sent confirmation instructions" do
        post api_v1_users_resend_confirmation_email_path({ user: { email: user.email } })
        expect(JSON.parse(response.body)).to include("notice" => "A confirmation email has been sent to #{user.email}.")
      end
    end

    context "when user is already confirmed" do
      before do
        user.confirm
      end

      it "redirects to root_path" do
        post api_v1_users_resend_confirmation_email_path({ user: { email: user.email } })
        expect(JSON.parse(response.body)).to include("error" => "Email was already confirmed, please try signing in")
      end
    end

    context "when user doesn't exist" do
      it "redirects to root_path" do
        post api_v1_users_resend_confirmation_email_path({ user: { email: "miru@example.com" } })
        expect(JSON.parse(response.body)).to include("error" => "Email not found")
      end
    end
  end
end
