# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invoice, type: :model do
  subject(:invoice) { build(:invoice_with_invoice_line_items) }

  describe "Validations" do
    describe "validate presence of" do
      it { is_expected.to validate_presence_of(:issue_date) }
      it { is_expected.to validate_presence_of(:due_date) }
      it { is_expected.to validate_presence_of(:invoice_number) }
    end

    describe "validate uniqueness of" do
      it { is_expected.to validate_uniqueness_of(:invoice_number).scoped_to(:company_id) }
    end

    describe "validate comparisons" do
      it "issue_date should not be after due_date" do
        expect(invoice.issue_date).to be <= invoice.due_date
      end
    end

    describe "validate numericality of" do
      it { is_expected.to validate_numericality_of(:amount).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:outstanding_amount).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:tax).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:amount_paid).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:amount_due).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:discount).is_greater_than_or_equal_to(0) }
    end

    describe "validate enum" do
      it do
        expect(subject).to define_enum_for(:status)
          .with_values([:draft, :sent, :viewed, :paid, :declined, :overdue, :sending, :waived])
      end
    end
  end

  describe "Associations" do
    describe "belongs to" do
      it { is_expected.to belong_to(:company) }
      it { is_expected.to belong_to(:client) }
    end

    describe "has many" do
      it { is_expected.to have_many(:invoice_line_items) }
    end

    describe "accepts_nested_attributes_for" do
      it { is_expected.to accept_nested_attributes_for(:invoice_line_items).allow_destroy(true) }
    end
  end

  describe "Discard" do
    let(:company) do
      create(:company_with_invoices)
    end

    before do
      @current_invoice = company.invoices.first
    end

    it "discards the invoices" do
      expect { @current_invoice.discard! }.to change(company.invoices.discarded, :count).by(1)
    end

    it "does not discard the invoices if already discarded" do
      @current_invoice.discard!
      expect { @current_invoice.discard! }.to raise_error(Discard::RecordNotDiscarded)
    end
  end

  describe "Scopes" do
    let(:company) { create(:company_with_invoices) }
    let(:draft_invoices) { company.invoices.with_statuses([:draft]).size }
    let(:paid_invoices) { company.invoices.with_statuses([:paid]).size }
    let(:overdue_invoices) { company.invoices.with_statuses([:overdue]).size }

    describe ".with_statuses" do
      it "returns all invoices if statuses are not specified" do
        expect(company.invoices.with_statuses(nil).size).to eq(5)
      end

      it "returns draft and paid invoices" do
        expect(company.invoices.with_statuses([:draft, :paid]).size).to eq(draft_invoices + paid_invoices)
      end

      it "returns draft, overdue and paid invoices" do
        expect(
          company.invoices.with_statuses(
            [:draft, :overdue,
             :paid]).size).to eq(draft_invoices + paid_invoices + overdue_invoices)
      end
    end

    describe "issue_date_range" do
      it "returns all invoices if date range is not specified" do
        expect(company.invoices.issue_date_range(nil).size).to eq(5)
      end
    end

    describe ".for_clients" do
      it "returns all invoices if clients are not specified" do
        expect(company.invoices.for_clients(nil).size).to eq(5)
      end

      it "returns invoices for specific clients" do
        expect(company.invoices.for_clients(company.clients.map { |c| c.id }).size).to eq(5)
      end
    end
  end

  describe "callbacks" do
    it { is_expected.to callback(:set_external_view_key).before(:validation).on(:create) }
    it { is_expected.to callback(:refresh_invoice_index).after(:commit) }
    it { is_expected.to callback(:lock_timesheet_entries).after(:save).if(:draft?) }
    it { is_expected.to callback(:unlock_timesheet_entries).after(:discard).if(:draft?) }
  end

  describe ".client_name" do
    it { is_expected.to delegate_method(:name).to(:client).with_prefix(:client) }
  end

  describe ".client_email" do
    it { is_expected.to delegate_method(:email).to(:client).with_prefix(:client) }
  end

  describe ".send_to_email" do
    let(:invoice) { create :invoice }
    let(:recipients) { [invoice.client.email, "miru@example.com"] }
    let(:subject) { "Invoice (#{invoice.invoice_number}) due on #{invoice.due_date}" }
    let(:message) do
      "#{invoice.client.company.name} has sent you an invoice (#{invoice.invoice_number}) for $#{invoice.amount.to_i} that's due on #{invoice.due_date}."
    end

    it "sends the invoice on email" do
      expect { invoice.send_to_email(subject:, recipients:, message:) }.to have_enqueued_mail(InvoiceMailer, :invoice)
    end
  end

  describe ".update_timesheet_entry_status" do
    it "updates the time_sheet_entries status to billed" do
      invoice.update_timesheet_entry_status!
      invoice.invoice_line_items.reload.each do |line_item|
        expect(line_item.timesheet_entry.bill_status).to eq("billed")
      end
    end
  end

  describe ".unit_amount" do
    let(:invoice) { create :invoice }

    it "returns the unit amount for normal_currencies" do
      normal_base_currency = "USD"
      expected_amount = (invoice.amount * 100).to_i

      expect(invoice.unit_amount(normal_base_currency)).to eq(expected_amount)
    end

    it "returns the unit amount for zero_decimal_currencies" do
      zero_base_currency = "JPY"
      expected_amount = (invoice.amount).to_i

      expect(invoice.unit_amount(zero_base_currency)).to eq(expected_amount)
    end

    describe ".save_invoice_without_reference" do
      let(:invoice) { create :invoice, reference: nil }

      it "saves the invoice without reference" do
        expect(invoice.valid?).to eq(true)
      end
    end

    # max 6 characters allowed for invoice
    describe "invoice max characters" do
      it "reference length should not exceed more then 12 characters" do
        invoice = build(:invoice, reference: "abcdef_123456")
        expect(invoice.valid?).to eq(false)
      end
    end
  end
end
