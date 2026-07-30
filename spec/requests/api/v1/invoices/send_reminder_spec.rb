# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices#send_reminder", type: :request do
  let(:invoice) { create(:invoice, status: :overdue) }
  let(:company) { invoice.company }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role(:admin, company)
    sign_in user
  end

  it "sends a reminder to at most five recipients" do
    expect do
      post send_reminder_api_v1_invoice_path(invoice),
        params: reminder_params([invoice.client.email]),
        headers: auth_headers(user)
    end.to have_enqueued_mail(SendReminderMailer, :send_reminder)

    expect(response).to have_http_status(:accepted)
  end

  it "rejects an empty recipient list" do
    expect do
      post send_reminder_api_v1_invoice_path(invoice),
        params: reminder_params([]),
        headers: auth_headers(user)
    end.not_to have_enqueued_mail(SendReminderMailer, :send_reminder)

    expect(response).to have_http_status(:unprocessable_content)
  end

  it "rejects more than five recipients" do
    recipients = 6.times.map { |index| "recipient-#{index}@example.com" }

    expect do
      post send_reminder_api_v1_invoice_path(invoice),
        params: reminder_params(recipients),
        headers: auth_headers(user)
    end.not_to have_enqueued_mail(SendReminderMailer, :send_reminder)

    expect(response).to have_http_status(:unprocessable_content)
  end

  def reminder_params(recipients)
    {
      invoice_email: {
        subject: "Payment reminder",
        recipients:,
        message: "Please pay the overdue invoice."
      }
    }
  end
end
