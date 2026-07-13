# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users#destroy", type: :request do
  let(:company) { create(:company, name: "Acme") }
  let(:super_admin) { create(:user, email: "hello@example.com", current_workspace_id: company.id) }
  let(:target_user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: super_admin)
    super_admin.add_role :admin, company
  end

  def delete_user(user, actor: super_admin)
    send_request :delete, api_v1_user_path(user), headers: auth_headers(actor)
  end

  context "when the current user is a super admin" do
    before do
      create(:employment, company:, user: target_user)
      target_user.add_role :employee, company
      sign_in super_admin
    end

    it "permanently deletes the user" do
      expect {
        delete_user(target_user)
      }.to change(User, :count).by(-1)

      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(
        I18n.t("user.super_admin_delete.success", email: target_user.email)
      )
      expect(User.exists?(target_user.id)).to be(false)
    end

    it "creates an audit record with actor and target details" do
      target_id = target_user.id
      target_email = target_user.email

      expect {
        delete_user(target_user)
      }.to change { Audited::Audit.where(action: "super_admin_delete").count }.by(1)

      audit = Audited::Audit.where(action: "super_admin_delete").last
      expect(audit.user).to eq(super_admin)
      expect(audit.auditable_id).to eq(target_id)
      expect(audit.auditable_type).to eq("User")
      expect(audit.audited_changes.symbolize_keys).to include(
        actor_id: super_admin.id,
        actor_email: super_admin.email,
        target_user_id: target_id,
        target_user_email: target_email
      )
      expect(audit.audited_changes.symbolize_keys[:occurred_at]).to be_present
    end
  end

  context "when the current user is not a super admin" do
    let(:admin_user) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: admin_user)
      create(:employment, company:, user: target_user)
      admin_user.add_role :admin, company
      target_user.add_role :employee, company
      sign_in admin_user
    end

    it "returns forbidden and does not delete the user" do
      expect {
        delete_user(target_user, actor: admin_user)
      }.not_to change(User, :count)

      expect(response).to have_http_status(:forbidden)
      expect(User.exists?(target_user.id)).to be(true)
    end
  end

  context "when the super admin deletes themself" do
    before { sign_in super_admin }

    it "returns forbidden and does not create an audit record" do
      audit_count = Audited::Audit.where(action: "super_admin_delete").count

      expect {
        delete_user(super_admin)
      }.not_to change(User, :count)

      expect(response).to have_http_status(:forbidden)
      expect(Audited::Audit.where(action: "super_admin_delete").count).to eq(audit_count)
    end
  end

  context "when the target user is the sole company owner" do
    before do
      create(:employment, company:, user: target_user)
      target_user.add_role :owner, company
      sign_in super_admin
    end

    it "blocks deletion until ownership is transferred or the company is deleted" do
      audit_count = Audited::Audit.where(action: "super_admin_delete").count

      expect {
        delete_user(target_user)
      }.not_to change(User, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(
        I18n.t("user.super_admin_delete.sole_owner", companies: company.name)
      )
      expect(User.exists?(target_user.id)).to be(true)
      expect(Audited::Audit.where(action: "super_admin_delete").count).to eq(audit_count)
    end
  end
end
