# frozen_string_literal: true

require "rails_helper"

RSpec.describe UpdateInvoiceStatusToOverdueService do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, company:, name: "bob") }
  let!(:client1_sent_invoice1) { create(:invoice, client: client1, status: "sent", due_date: Date.current + 1) }
  let!(:client1_sent_invoice2) { create(:invoice, client: client1, status: "sent", due_date: Date.current - 1) }
  let!(:client1_sent_invoice3) { create(:invoice, client: client1, status: "sent", due_date: Date.current - 2) }
  let(:client1_paid_invoice2) { create(:invoice, client: client1, status: "paid", due_date: Date.current - 1) }
  let!(:client1_draft_invoice1) { create(:invoice, client: client1, due_date: Date.current - 1) }
  let!(:client1_viewed_invoice1) { create(:invoice, client: client1, status: "viewed", due_date: Date.current + 1) }
  let!(:client1_viewed_invoice2) { create(:invoice, client: client1, status: "viewed", due_date: Date.current - 1) }

  describe "#process" do
    before do
      described_class.new.process
      client1_sent_invoice1.reload
      client1_sent_invoice2.reload
      client1_sent_invoice3.reload
      client1_paid_invoice2.reload
      client1_draft_invoice1.reload
      client1_viewed_invoice1.reload
      client1_viewed_invoice2.reload
    end

    it "updates status of only `sent` & 'viewed' invoices whose due date is passed" do
      expect(client1_sent_invoice1.status).to eq("sent")
      expect(client1_sent_invoice2.status).to eq("overdue")
      expect(client1_sent_invoice3.status).to eq("overdue")
      expect(client1_paid_invoice2.status).to eq("paid")
      expect(client1_draft_invoice1.status).to eq("draft")
      expect(client1_viewed_invoice1.status).to eq("viewed")
      expect(client1_viewed_invoice2.status).to eq("overdue")
    end
  end
end
