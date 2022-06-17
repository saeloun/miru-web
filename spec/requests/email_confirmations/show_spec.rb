# frozen_string_literal: true

require "rails_helper"

RSpec.describe "EmailConfirmationsController", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user) }

  describe "GET show" do
    context "when user is not confirmed" do
      before do
        user.update(confirmed_at: nil)
        get email_confirmation_path(email: user.email)
      end

      it "renders email confirmation page" do
        expect(response).to render_template(:show)
      end
    end

    context "when user is confirmed" do
      before do
        user.update(confirmed_at: Time.zone.now)
        get email_confirmation_path(email: user.email)
      end

      it "redirects to root path" do
        expect(response).to redirect_to(root_path)
      end
    end

    context "when user is not found" do
      before do
        get email_confirmation_path(email: "invalid")
      end

      it "responds with :not_found" do
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
