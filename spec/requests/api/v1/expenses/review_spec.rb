# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Expense review actions", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:expense) { create(:expense, company:, category_name: "Travel", user: employee) }

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

  it "forbids employees from rejecting their own expense" do
    sign_in employee

    patch reject_api_v1_expense_path(expense)

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

  it "cannot reopen an already-paid claim through approval, rejection or a direct model transition" do
    expense.approve!
    expense.mark_paid!
    paid_at = expense.reload.paid_at
    sign_in admin

    patch approve_api_v1_expense_path(expense)
    expect(response).to have_http_status(:forbidden)
    patch reject_api_v1_expense_path(expense)
    expect(response).to have_http_status(:forbidden)
    expect(expense.reload).to have_attributes(status: "paid", paid_at:)

    [:approve!, :reject!].each do |action|
      expect { expense.public_send(action) }.to raise_error(ActiveRecord::RecordInvalid)
      expense.reload
    end
    expect { expense.update!(status: :submitted) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(expense.reload).to have_attributes(status: "paid", paid_at:)
    expense.update_column(:status, :approved)
    patch approve_api_v1_expense_path(expense)
    expect(response).to have_http_status(:forbidden)
    expect { expense.reload.approve! }.to raise_error(ActiveRecord::RecordInvalid)
    expect(expense.reload.paid_at).to eq(paid_at)
  end

  it "rechecks a stale approved claim under lock before paying or reviewing it" do
    expense.approve!
    stale = Expense.find(expense.id)
    expense.mark_paid!
    expect { stale.reject! }.to raise_error(ActiveRecord::RecordInvalid)
    expect(expense.reload.status).to eq("paid")
    expect { stale.reload.mark_paid! }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "preserves paid financial facts against fresh admin edits and direct model writes" do
    expense.approve!
    expense.mark_paid!
    original = expense.reload.attributes
    sign_in admin

    patch api_v1_expense_path(expense), params: { expense: { amount: 6000 } }
    expect(response).to have_http_status(:forbidden)
    expect(expense.reload.attributes).to eq(original)

    { amount: 6000, currency: "USD", date: Date.yesterday, user_id: admin.id,
      base_currency_amount: 6000, exchange_rate: 2, approved_at: nil }.each do |field, value|
      expect { expense.update!(field => value) }.to raise_error(ActiveRecord::RecordInvalid)
      expect(expense.reload.attributes).to eq(original)
    end
  end

  it "rejects a direct stale model write after another instance records payment" do
    expense.approve!
    stale = Expense.find(expense.id)
    stale_amount = Expense.find(expense.id)
    expense.mark_paid!
    expect { stale.update!(status: :rejected) }.to raise_error(ActiveRecord::RecordInvalid)
    expect { stale_amount.update!(amount: 6000) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(expense.reload.status).to eq("paid")
  end

  it "reloads a stale approved claim before authorizing deletion after another request pays it" do
    expense.approve!
    stale = Expense.find(expense.id)
    expense.mark_paid!
    allow_any_instance_of(Api::V1::ExpensesController).to receive(:set_expense) do |controller|
      controller.instance_variable_set(:@expense, stale)
    end
    sign_in admin
    delete api_v1_expense_path(expense)
    expect(response).to have_http_status(:forbidden)
    expect(expense.reload).to have_attributes(status: "paid", discarded_at: nil)
  end

  it "does not record payment after a competing request discards the claim first" do
    expense.approve!
    stale = Expense.find(expense.id)
    expense.discard!
    expect { stale.mark_paid! }.to raise_error(ActiveRecord::RecordInvalid)
    expect(expense.reload).to have_attributes(status: "approved", paid_at: nil)
  end

  it "reloads a stale rejected claim before authorizing an employee edit and resubmission" do
    expense.reject!
    stale = Expense.find(expense.id)
    expense.approve!
    expense.mark_paid!
    paid_at = expense.reload.paid_at
    allow_any_instance_of(Api::V1::ExpensesController).to receive(:set_expense) do |controller|
      controller.instance_variable_set(:@expense, stale)
    end
    sign_in employee

    patch api_v1_expense_path(expense), params: { expense: { description: "Stale rejected-claim edit" } }

    expect(response).to have_http_status(:forbidden)
    expect(expense.reload).to have_attributes(status: "paid", paid_at:)
    expect(expense.description).not_to eq("Stale rejected-claim edit")
  end

  it "requires renewed approval after changing an approved claim amount before recording payment" do
    expense.approve!
    sign_in admin
    patch api_v1_expense_path(expense), params: { expense: { amount: "6000" } }
    expect(response).to have_http_status(:ok)
    expect(expense.reload).to have_attributes(status: "submitted", approved_at: nil)
    patch mark_paid_api_v1_expense_path(expense)
    expect(response).to have_http_status(422)
    patch approve_api_v1_expense_path(expense)
    expect(response).to have_http_status(:ok)
    patch mark_paid_api_v1_expense_path(expense)
    expect(response).to have_http_status(:ok)
    expect(expense.reload).to have_attributes(status: "paid", amount: BigDecimal("6000"))
  end

  it "exposes missing historical approval time and records an explicit current reconfirmation" do
    expense.approve!
    expense.update_column(:approved_at, nil)
    sign_in admin
    get api_v1_expenses_path
    expect(json_response.fetch("expenses").find { |item| item["id"] == expense.id }.fetch("approvedAt")).to be_nil
    patch approve_api_v1_expense_path(expense)
    expect(response).to have_http_status(:ok)
    expect(expense.reload.approved_at).to be_present
    get api_v1_expenses_path
    expect(json_response.fetch("expenses").find { |item| item["id"] == expense.id }.fetch("approvedAt")).to be_present
  end

  it "preserves the first approval timestamp when a stale approval retries after the cutoff day" do
    stale = Expense.find(expense.id)
    expense.approve!
    approved_at = expense.reload.approved_at
    travel_to(1.day.from_now) do
      stale.approve!
      expect(stale.reload.approved_at).to eq(approved_at)
    end
  end
end
