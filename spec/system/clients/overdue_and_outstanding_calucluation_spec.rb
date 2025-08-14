# frozen_string_literal: true

require "rails_helper"

describe "Client overdue and outstanding calculation", type: :system, js: true do
  let!(:company) { create(:company) }
  let!(:client) { create(:client, company:) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:invoice1) { create(:invoice_with_invoice_line_items, client:, status: "sent") }
  let!(:invoice2) { create(:invoice_with_invoice_line_items, client:, status: "viewed") }
  let!(:invoice3) { create(:invoice_with_invoice_line_items, client:, status: "overdue") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "calculates overdue and outstanding amounts correctly" do
    with_forgery_protection do
      visit "/clients"

      overdue_amount = invoice3.amount
      outstanding_amount = invoice1.amount + invoice2.amount + invoice3.amount

      expect(client.client_overdue_and_outstanding_calculation[:overdue_amount]).to eq(overdue_amount)
      expect(client.client_overdue_and_outstanding_calculation[:outstanding_amount]).to eq(outstanding_amount)
      expect(client.client_overdue_and_outstanding_calculation[:currency]).to eq(company.base_currency)
    end
  end
end
