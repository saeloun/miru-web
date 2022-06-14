# frozen_string_literal: true

require "rails_helper"

RSpec.describe "EmailConfirmationsController", type: :request do
  let(:user) { create(:user) }

  describe "GET #resend" do
    context "when user is not confirmed" do
      before do
        user.update(confirmed_at: nil)
      end

      it "sent confirmation instructions" do
        get resend_email_confirmation_path(email: user.email)

        expect(Devise::Mailer.deliveries.count).to eq 1
        expect(flash[:notice]).to eq(
          I18n.t("confirmation.send_instructions", email: user.email)
        )
      end

      it "redirects to new_user_session_path" do
        get resend_email_confirmation_path(email: user.email)

        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when user is already confirmed" do
      before do
        user.confirm
      end

      it "redirects to root_path" do
        get resend_email_confirmation_path(email: user.email)

        expect(response).to redirect_to root_path
      end
    end
  end
end
