# frozen_string_literal: true

require "rails_helper"

RSpec.describe "EmailConfirmationsController", type: :request do
  let(:user) { create(:user) }

  describe "POST #resend" do
    context "when user is not confirmed" do
      before do
        user.update(confirmed_at: nil)
      end

      it "sent confirmation instructions" do
        post resend_internal_api_v1_email_confirmation_path(email: user.email)
        expect(JSON.parse(response.body)).to include("notice" => "A confirmation email has been sent to #{user.email}.")
      end
    end

    context "when user is already confirmed" do
      before do
        user.confirm
      end

      it "redirects to root_path" do
        post resend_internal_api_v1_email_confirmation_path(email: user.email)

        expect(response).to redirect_to root_path
      end
    end
  end
end
