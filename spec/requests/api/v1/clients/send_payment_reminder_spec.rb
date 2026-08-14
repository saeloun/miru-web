# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Clients#send_payment_reminder", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:invoice) { create(:invoice, client:, status: :overdue) }
  let(:recipient) { create(:user) }

  before do
    create(:employment, company:, user: admin)
    admin.add_role(:admin, company)
    create(:client_member, client:, company:, user: recipient)
    sign_in admin
  end

  it "uses the client's recipients instead of request-supplied addresses" do
    perform_enqueued_jobs do
      post send_payment_reminder_api_v1_client_path(client),
        params: reminder_params([invoice.id], ["attacker@example.com"]),
        headers: auth_headers(admin)
    end

    expect(response).to have_http_status(:accepted)
    expect(ActionMailer::Base.deliveries.last.to).to eq([recipient.email])
  end

  it "rejects invoices from another client" do
    other_invoice = create(:invoice)

    expect do
      post send_payment_reminder_api_v1_client_path(client),
        params: reminder_params([invoice.id, other_invoice.id], [recipient.email]),
        headers: auth_headers(admin)
    end.not_to have_enqueued_mail(SendPaymentReminderMailer, :send_payment_reminder)

    expect(response).to have_http_status(:not_found)
  end

  it "rejects an empty invoice selection" do
    expect do
      post send_payment_reminder_api_v1_client_path(client),
        params: reminder_params([], [recipient.email]),
        headers: auth_headers(admin)
    end.not_to have_enqueued_mail(SendPaymentReminderMailer, :send_payment_reminder)

    expect(response).to have_http_status(:not_found)
  end

  def reminder_params(invoice_ids, recipients)
    {
      client_email: {
        email_params: {
          recipients:,
          subject: "Payment reminder",
          message: "Please pay the selected invoices."
        },
        selected_invoices: invoice_ids
      }
    }
  end
end
