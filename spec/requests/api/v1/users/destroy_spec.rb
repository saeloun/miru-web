# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users#destroy", type: :request do
  let(:company) { create(:company, name: "Acme") }
  let(:super_admin) { create(:user, email: "hello@saeloun.com", current_workspace_id: company.id) }
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

    { salary_slip: [:uploaded_by, :published_by, :withdrawn_by],
      tax_declaration: [:reviewed_by, :withdrawn_by], consultant_compensation: [:created_by] }.each do |kind, actors|
      actors.each do |actor|
        it "retains the user and coworker's #{kind} history when referenced as #{actor}" do
          coworker = create(:employment, company:)
          record = case kind
                   when :salary_slip
                     SalarySlip.create!(employment: coworker, uploaded_by: super_admin, pay_month: "2026-09-01",
                       source: "Payroll provider", actor => target_user,
                       file: { io: File.open(Rails.root.join("spec/support/fixtures/pdf-file.pdf")),
                               filename: "slip.pdf", content_type: "application/pdf" })
                   when :tax_declaration
                     TaxDeclaration.create!(employment: coworker, tax_year: 2026, category: "investment",
                       claimed_amount: 1000, actor => target_user)
                   when :consultant_compensation
                     enable_synthetic_payroll(company.id)
                     ConsultantCompensation.create!(employment: coworker, created_by: target_user,
                       monthly_fee: 100_000, effective_on: "2026-09-01", payment_source: "india",
                       legal_entity_name: company.name, hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], change_reason: "Agreed terms")
          end
          audit_count = Audited::Audit.where(action: "super_admin_delete").count
          delete_user(target_user)
          expect(response).to have_http_status(:unprocessable_content)
          expect(json_response.fetch("errors")).to include("Deactivate")
          expect(User.exists?(target_user.id)).to be(true)
          expect(target_user.employments.count).to eq(1)
          expect(record.reload.public_send(actor)).to eq(target_user)
          expect(Audited::Audit.where(action: "super_admin_delete").count).to eq(audit_count)
        end
      end
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
