# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Expense review actions", type: :request do
  let(:company) { create(:company) }
  let(:expense_category) { create(:expense_category, company:) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:expense) { create(:expense, company:, expense_category:, user: employee) }

  before do
    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    create(:employment, company:, user: employee)
    employee.add_role :employee, company
  end

  it "allows admins to approve an expense and notify the submitter" do
    sign_in admin

    expect do
      patch approve_api_v1_expense_path(expense)
    end.to have_enqueued_mail(ExpenseMailer, :approved)

    expect(response).to have_http_status(:ok)
    expect(expense.reload.status).to eq("approved")
  end

  it "allows admins to reject an expense and notify the submitter" do
    sign_in admin

    expect do
      patch reject_api_v1_expense_path(expense)
    end.to have_enqueued_mail(ExpenseMailer, :rejected)

    expect(response).to have_http_status(:ok)
    expect(expense.reload.status).to eq("rejected")
  end

  it "forbids employees from approving their own expense" do
    sign_in employee

    patch approve_api_v1_expense_path(expense)

    expect(response).to have_http_status(:forbidden)
    expect(expense.reload.status).to eq("submitted")
  end

  it "resubmits a rejected expense when the employee edits it" do
    expense.update!(status: :rejected)
    sign_in employee

    expect do
      patch api_v1_expense_path(expense), params: {
        expense: {
          description: "Updated meal reimbursement"
        }
      }
    end.to have_enqueued_mail(ExpenseMailer, :submitted)

    expect(response).to have_http_status(:ok)
    expect(expense.reload.status).to eq("submitted")
    expect(expense.description).to eq("Updated meal reimbursement")
  end
end
