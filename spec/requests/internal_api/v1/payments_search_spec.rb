# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payment Search Integration", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  # Create clients
  let!(:client_acme) { create(:client, name: "Acme Corporation", company:) }
  let!(:client_tech) { create(:client, name: "Tech Solutions Inc", company:) }
  let!(:client_global) { create(:client, name: "Global Services", company:) }

  # Create invoices
  let!(:invoice1) do
    create(:invoice,
      client: client_acme,
      company:,
      invoice_number: "INV-2024-001",
      status: "paid",
      amount: 5000.00)
  end

  let!(:invoice2) do
    create(:invoice,
      client: client_tech,
      company:,
      invoice_number: "INV-2024-002",
      status: "paid",
      amount: 7500.00)
  end

  let!(:invoice3) do
    create(:invoice,
      client: client_global,
      company:,
      invoice_number: "INV-2024-003",
      status: "paid",
      amount: 3000.00)
  end

  let!(:invoice4) do
    create(:invoice,
      client: client_acme,
      company:,
      invoice_number: "INV-2024-004",
      status: "paid",
      amount: 2500.00)
  end

  # Create payments
  let!(:payment1) do
    create(:payment,
      invoice: invoice1,
      amount: 5000.00,
      transaction_date: 5.days.ago,
      transaction_type: "bank_transfer")
  end

  let!(:payment2) do
    create(:payment,
      invoice: invoice2,
      amount: 7500.00,
      transaction_date: 3.days.ago,
      transaction_type: "credit_card")
  end

  let!(:payment3) do
    create(:payment,
      invoice: invoice3,
      amount: 3000.00,
      transaction_date: 2.days.ago,
      transaction_type: "stripe")
  end

  let!(:payment4) do
    create(:payment,
      invoice: invoice4,
      amount: 2500.00,
      transaction_date: 1.day.ago,
      transaction_type: "paypal")
  end

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  describe "comprehensive search scenarios" do
    context "searching by client name" do
      it "returns payments for matching client" do
        get "/internal_api/v1/payments", params: { query: "Acme" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        # Should return 2 Acme payments
        expect(json["payments"].length).to eq(2)

        client_names = json["payments"].pluck("clientName").uniq
        expect(client_names).to eq(["Acme Corporation"])

        invoice_numbers = json["payments"].pluck("invoiceNumber")
        expect(invoice_numbers).to contain_exactly("INV-2024-001", "INV-2024-004")
      end

      it "performs case-insensitive search" do
        get "/internal_api/v1/payments", params: { query: "TECH SOLUTIONS" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json["payments"].length).to eq(1)
        expect(json["payments"].first["clientName"]).to eq("Tech Solutions Inc")
      end

      it "supports partial client name matching" do
        get "/internal_api/v1/payments", params: { query: "Global" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json["payments"].length).to eq(1)
        expect(json["payments"].first["clientName"]).to eq("Global Services")
      end
    end

    context "searching by invoice number" do
      it "returns exact invoice match" do
        get "/internal_api/v1/payments", params: { query: "INV-2024-002" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json["payments"].length).to eq(1)
        expect(json["payments"].first["invoiceNumber"]).to eq("INV-2024-002")
        expect(json["payments"].first["clientName"]).to eq("Tech Solutions Inc")
      end

      it "supports partial invoice number search" do
        get "/internal_api/v1/payments", params: { query: "2024-003" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json["payments"].length).to eq(1)
        expect(json["payments"].first["invoiceNumber"]).to eq("INV-2024-003")
      end

      it "finds multiple invoices with common pattern" do
        get "/internal_api/v1/payments", params: { query: "2024" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        # All invoices contain "2024"
        expect(json["payments"].length).to eq(4)
      end
    end

    context "searching by amount" do
      it "finds exact amount match" do
        get "/internal_api/v1/payments", params: { query: "7500" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json["payments"].length).to eq(1)
        expect(json["payments"].first["amount"].to_f).to eq(7500.00)
        expect(json["payments"].first["clientName"]).to eq("Tech Solutions Inc")
      end

      it "supports partial amount matching" do
        get "/internal_api/v1/payments", params: { query: "500" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        # Should match 2500, 5000, 7500
        expect(json["payments"].length).to eq(3)

        amounts = json["payments"].map { |p| p["amount"].to_f }.sort
        expect(amounts).to eq([2500.00, 5000.00, 7500.00])
      end

      it "finds decimal amounts" do
        get "/internal_api/v1/payments", params: { query: "3000" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json["payments"].length).to eq(1)
        expect(json["payments"].first["amount"].to_f).to eq(3000.00)
      end
    end

    context "edge cases" do
      it "returns all payments for empty search" do
        get "/internal_api/v1/payments", params: { query: "" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json["payments"].length).to eq(4)
      end

      it "returns all payments for whitespace-only search" do
        get "/internal_api/v1/payments", params: { query: "   " }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json["payments"].length).to eq(4)
      end

      it "returns empty array for non-matching search" do
        get "/internal_api/v1/payments", params: { query: "NonExistentCompany" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json["payments"]).to eq([])
      end

      it "handles special characters in search" do
        get "/internal_api/v1/payments", params: { query: "INV-" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        # All invoices start with "INV-"
        expect(json["payments"].length).to eq(4)
      end
    end

    context "search result ordering" do
      it "maintains date ordering in search results" do
        get "/internal_api/v1/payments", params: { query: "Acme" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        # Results should be ordered by created_at desc (most recent first)
        payment_ids = json["payments"].pluck("id")
        expect(payment_ids).to eq([payment4.id, payment1.id])
      end
    end

    context "combined search patterns" do
      it "can find payments by partial client and amount pattern" do
        # Create a payment with specific amount pattern
        special_invoice = create(:invoice,
          client: client_tech,
          company:,
          invoice_number: "INV-SPECIAL-999",
          status: "paid",
          amount: 9999.00)

        create(:payment,
          invoice: special_invoice,
          amount: 9999.00,
          transaction_date: Date.today,
          transaction_type: "stripe")

        # Search for "999" should find this special payment
        get "/internal_api/v1/payments", params: { query: "999" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json["payments"].length).to eq(1)
        expect(json["payments"].first["invoiceNumber"]).to eq("INV-SPECIAL-999")
        expect(json["payments"].first["amount"].to_f).to eq(9999.00)
      end
    end
  end

  describe "search performance" do
    it "handles large result sets" do
      # Create many payments for performance testing
      10.times do |i|
        invoice = create(:invoice,
          client: client_acme,
          company:,
          invoice_number: "BULK-#{i}",
          status: "paid")

        create(:payment,
          invoice: invoice,
          amount: 1000.00 * (i + 1),
          transaction_date: i.days.ago)
      end

      get "/internal_api/v1/payments", params: { query: "BULK" }

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)

      expect(json["payments"].length).to eq(10)
    end
  end
end
