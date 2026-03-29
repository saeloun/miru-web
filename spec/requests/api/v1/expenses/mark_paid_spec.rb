# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Expense#mark_paid", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:expense) { create(:expense, company:, category_name: "Travel", user: employee, status: :approved) }

  before do
    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    create(:employment, company:, user: employee)
    employee.add_role :employee, company
  end

  it "marks the expense as paid and notifies the submitter" do
    sign_in admin

    expect do
      patch mark_paid_api_v1_expense_path(expense)
    end.to have_enqueued_mail(ExpenseMailer, :paid)

    expect(response).to have_http_status(:ok)
    expect(expense.reload.status).to eq("paid")
    expect(expense.paid_at).to be_present
  end

  it "rejects marking a submitted expense as paid" do
    expense.update!(status: :submitted)
    sign_in admin

    patch mark_paid_api_v1_expense_path(expense)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(json_response["error"]).to eq(I18n.t("expenses.must_be_approved"))
    expect(expense.reload.status).to eq("submitted")
  end

  it "forbids employees from marking their own expense as paid" do
    sign_in employee

    patch mark_paid_api_v1_expense_path(expense)

    expect(response).to have_http_status(:forbidden)
    expect(expense.reload.status).to eq("approved")
  end
end
