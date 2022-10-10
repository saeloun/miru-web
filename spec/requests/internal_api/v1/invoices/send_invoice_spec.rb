# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#send_invoice", type: :request do
  let(:client) { create :client }
  let(:company) { client.company }
  let(:user) { create :user, current_workspace_id: company.id }
  let(:invoice_email) {
  { subject: "Some Subject", recipients: [client.email, "miru@example.com"], message: "You have an invoice!" }
}
  let(:time_entry_1) { create :timesheet_entry }

  let(:invoice_params) { {
    amount: 7750,
    amount_due: 7750,
    amount_paid: 0,
    client_id: client.id,
    discount: 0,
    due_date: "10.11.2022",
    invoice_number: Faker::Alphanumeric.unique.alpha(number: 4),
    issue_date: "10.10.2022",
    reference: "",
    tax: 0,
    invoice_line_items_attributes: [{
      name: "Test",
      description: "test description",
      date: Faker::Date.in_date_period,
      rate: 12.4,
      quantity: 34.54,
      timesheet_entry_id: time_entry_1.id
    }]
  }
    }

  subject { post send_invoice_internal_api_v1_invoices_path, params: { invoice_email:, invoice: invoice_params } }

  context "when user is signed in" do
    before do
      create(:employment, company:, user:)
    end

    context "when user is an admin" do
      before do
        user.add_role :admin, company
        sign_in user
      end

      it "returns a 202 response" do
        subject
        expect(response).to have_http_status :accepted
        expect(json_response["message"]).to eq("Invoice will be sent!")
      end

      it "checks if invoice is created" do
        subject
        expect(Invoice.last.invoice_number).to eq(invoice_params[:invoice_number])
      end

      it "enqueues an email for delivery" do
        expect do
          subject
        end.to have_enqueued_mail(InvoiceMailer, :invoice)
      end

      it "changes time_sheet_entries status to billed" do
        subject
        Invoice.last.invoice_line_items.each do |line_item|
          expect(line_item.timesheet_entry.bill_status).to eq("billed")
        end
      end
    end

    context "when user is an employee" do
      before do
        user.add_role :employee, company
        sign_in user
      end

      it "returns a 403 response" do
        subject
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is a book keeper" do
      before do
        user.add_role :book_keeper, company
        sign_in user
      end

      it "returns a 403 response" do
        subject
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when user is logged out" do
    it "returns a 401 response" do
      subject

      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
