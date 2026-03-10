# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::ExpensesController, type: :controller do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:expense) { create(:expense, company:, category_name: "Travel", vendor_name: "Jetway", user: employee) }
  let(:receipt) do
    fixture_file_upload(
      Rails.root.join("spec", "support", "fixtures", "test-image.png"),
      "image/png"
    )
  end

  before do
    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    create(:employment, company:, user: employee)
    employee.add_role :employee, company
  end

  describe "POST #create" do
    before do
      sign_in employee
    end

    it "creates an employee reimbursement, attaches receipts, and notifies reviewers" do
      expect do
        post :create, params: {
          expense: {
            amount: 24.50,
            date: Date.current.iso8601,
            description: "Airport reimbursement",
            expense_type: "business",
            category_name: "Travel",
            vendor_name: "Jetway",
            receipts: [receipt]
          }
        }, format: :json
      end.to have_enqueued_mail(ExpenseMailer, :submitted)

      expect(response).to have_http_status(:ok)
      expect(Expense.last.user).to eq(employee)
      expect(Expense.last.receipts.count).to eq(1)
    end
  end

  describe "PATCH #approve" do
    before do
      sign_in admin
    end

    it "approves the reimbursement and notifies the submitter" do
      expect do
        patch :approve, params: { id: expense.id }, format: :json
      end.to have_enqueued_mail(ExpenseMailer, :approved)

      expect(response).to have_http_status(:ok)
      expect(expense.reload.status).to eq("approved")
    end
  end

  describe "PATCH #reject" do
    before do
      sign_in admin
    end

    it "rejects the reimbursement and notifies the submitter" do
      expect do
        patch :reject, params: { id: expense.id }, format: :json
      end.to have_enqueued_mail(ExpenseMailer, :rejected)

      expect(response).to have_http_status(:ok)
      expect(expense.reload.status).to eq("rejected")
    end
  end

  describe "PATCH #mark_paid" do
    before do
      sign_in admin
      expense.update!(status: :approved)
    end

    it "marks an approved reimbursement as paid and notifies the submitter" do
      expect do
        patch :mark_paid, params: { id: expense.id }, format: :json
      end.to have_enqueued_mail(ExpenseMailer, :paid)

      expect(response).to have_http_status(:ok)
      expect(expense.reload.status).to eq("paid")
      expect(expense.paid_at).to be_present
    end
  end
end
