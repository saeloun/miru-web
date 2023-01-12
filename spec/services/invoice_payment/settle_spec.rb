# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::Settle do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, company:, name: "bob") }

  context "when payment amount is same as total invoice amount" do
    let!(:client1_sent_invoice1) { create(
      :invoice,
      client: client1, status: "sent",
      amount: 100, amount_due: 100, amount_paid: 0
      )
    }
    let!(:payment_params) { {
      invoice_id: client1_sent_invoice1.id,
      transaction_date: Date.current,
      transaction_type: "visa",
      amount: 100,
      note: "This is transaction ID - 123"
    }
    }

    subject { described_class.new(payment_params, client1_sent_invoice1).process }

    before do
      subject
    end

    it "adds the payment entry to the database" do
      expect(Payment.last.invoice.id).to eq(client1_sent_invoice1.id)
      expect(Payment.last.status).to eq("paid")
    end

    it "updates the invoice details correctly in the database" do
      client1_sent_invoice1.reload
      expect(client1_sent_invoice1.amount_due).to eq(0)
      expect(client1_sent_invoice1.amount_paid).to eq(100)
      expect(client1_sent_invoice1.status).to eq("paid")
    end
  end

  context "when payment amount is less than total invoice amount" do
    let!(:client1_sent_invoice1) { create(
      :invoice,
      client: client1, status: "sent",
      amount: 100, amount_due: 100, amount_paid: 0
      )
    }
    let!(:payment_params) { {
      invoice_id: client1_sent_invoice1.id,
      transaction_date: Date.current,
      transaction_type: "visa",
      amount: 90,
      note: "This is transaction ID - 123"
    }
}

    subject { described_class.new(payment_params, client1_sent_invoice1).process }

    before do
      subject
    end

    it "adds the payment entry to the database" do
      expect(Payment.last.invoice.id).to eq(client1_sent_invoice1.id)
      expect(Payment.last.status).to eq("partially_paid")
    end

    it "updates the invoice details correctly in the database" do
      client1_sent_invoice1.reload
      expect(client1_sent_invoice1.amount_due).to eq(10)
      expect(client1_sent_invoice1.amount_paid).to eq(90)
      expect(client1_sent_invoice1.status).to eq("sent")
    end
  end

  context "when payment amount is more than total invoice amount" do
    let!(:client1_sent_invoice1) { create(
      :invoice,
      client: client1, status: "sent",
      amount: 100, amount_due: 100, amount_paid: 0)
      }
    let!(:payment_params) { {
      invoice_id: client1_sent_invoice1.id,
      transaction_date: Date.current,
      transaction_type: "visa",
      amount: 120,
      note: "This is transaction ID - 123"
    }
}

    subject { described_class.new(payment_params, client1_sent_invoice1).process }

    before do
      subject
    end

    it "adds the payment entry to the database" do
      expect(Payment.last.invoice.id).to eq(client1_sent_invoice1.id)
      expect(Payment.last.status).to eq("paid")
    end

    it "updates the invoice details correctly in the database" do
      client1_sent_invoice1.reload
      expect(client1_sent_invoice1.amount_due).to eq(0)
      expect(client1_sent_invoice1.amount_paid).to eq(120)
      expect(client1_sent_invoice1.status).to eq("paid")
    end
  end
end
