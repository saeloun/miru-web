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

RSpec.describe InvoicePayment::Settle, "Stripe confirmation commits" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
    invoice
    clear_enqueued_jobs
  end

  let(:invoice) { create(:invoice, status: "sent", amount: 100, amount_due: 100, amount_paid: 0) }
  let(:payment_params) do
    { invoice_id: invoice.id, transaction_date: Date.current, transaction_type: "stripe", amount: 100 }
  end

  it "enqueues both confirmations after a standalone settlement commits" do
    expect do
      described_class.process(payment_params, invoice)
    end.to have_enqueued_mail(PaymentMailer, :payment)
      .and have_enqueued_mail(ClientPaymentMailer, :payment)
  end

  it "enqueues both confirmations only after the invoice lock commits" do
    expect do
      invoice.with_lock do
        described_class.process(payment_params, invoice)

        expect(enqueued_jobs).to be_empty
      end
    end.to have_enqueued_mail(PaymentMailer, :payment)
      .and have_enqueued_mail(ClientPaymentMailer, :payment)
  end

  it "keeps a captured payment when a confirmation cannot be enqueued" do
    error = StandardError.new("Synthetic mail queue unavailable")
    allow(PaymentMailer).to receive_message_chain(:with, :payment, :deliver_later).and_raise(error)
    allow(Sentry).to receive(:capture_exception)

    expect do
      invoice.with_lock { described_class.process(payment_params, invoice) }
    end.not_to raise_error

    expect(invoice.reload).to be_paid
    expect(invoice.payments.count).to eq(1)
    expect(Sentry).to have_received(:capture_exception).with(error)
  end

  it "does not send confirmations for a rolled-back settlement" do
    invoice.with_lock do
      described_class.process(payment_params, invoice)
      raise ActiveRecord::Rollback
    end

    expect(invoice.reload).to be_sent
    expect(invoice.payments).to be_empty
    expect(enqueued_jobs).to be_empty
  end

  it "commits a reconciliation payment without updating the paid invoice or sending confirmations" do
    described_class.process(payment_params.merge(provider_event_id: "stripe:pi_first"), invoice)
    clear_enqueued_jobs

    payment = nil
    expect do
      invoice.with_lock do
        payment = described_class.process(payment_params.merge(provider_event_id: "stripe:pi_late"), invoice,
          reconcile: true)
      end
    end.to change(Payment, :count).by(1)

    expect(payment).to have_attributes(status: "partially_paid", amount: 100)
    expect(invoice.reload).to have_attributes(status: "paid", amount_paid: 100, amount_due: 0)
    expect(enqueued_jobs).to be_empty
  end

  [nil, "evt_legacy"].each do |legacy_reference|
    it "flags ambiguous capture evidence instead of duplicating a legacy #{legacy_reference.inspect} payment" do
      described_class.process(payment_params.merge(provider_event_id: legacy_reference), invoice)
      clear_enqueued_jobs
      allow(Sentry).to receive(:capture_message)
      late_params = payment_params.merge(provider_event_id: "stripe:pi_late")

      expect do
        invoice.with_lock { described_class.process(late_params, invoice, reconcile: true) }
      end.not_to change(Payment, :count)

      expect(Sentry).to have_received(:capture_message).with(
        "Stripe capture requires legacy payment reconciliation", level: :warning,
        extra: { invoice_id: invoice.id, provider_event_id: "stripe:pi_late" })
      expect(invoice.reload).to have_attributes(status: "paid", amount_paid: 100, amount_due: 0)
      expect(enqueued_jobs).to be_empty
    end
  end
end
