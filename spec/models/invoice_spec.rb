# frozen_string_literal: true

# == Schema Information
#
# Table name: invoices
#
#  id                     :bigint           not null, primary key
#  amount                 :decimal(20, 2)   default(0.0)
#  amount_due             :decimal(20, 2)   default(0.0)
#  amount_paid            :decimal(20, 2)   default(0.0)
#  base_currency_amount   :decimal(20, 2)   default(0.0)
#  client_payment_sent_at :datetime
#  currency               :string           default("USD"), not null
#  discarded_at           :datetime
#  discount               :decimal(20, 2)   default(0.0)
#  due_date               :date
#  exchange_rate          :decimal(18, 10)
#  exchange_rate_date     :date
#  external_view_key      :string
#  invoice_number         :string
#  issue_date             :date
#  outstanding_amount     :decimal(20, 2)   default(0.0)
#  payment_infos          :jsonb
#  payment_sent_at        :datetime
#  reference              :text
#  sent_at                :datetime
#  status                 :integer          default("draft"), not null
#  stripe_enabled         :boolean          default(TRUE)
#  tax                    :decimal(20, 2)   default(0.0)
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  client_id              :bigint           not null
#  company_id             :bigint
#
# Indexes
#
#  index_invoices_on_client_id                      (client_id)
#  index_invoices_on_company_id                     (company_id)
#  index_invoices_on_discarded_at                   (discarded_at)
#  index_invoices_on_due_date                       (due_date)
#  index_invoices_on_external_view_key              (external_view_key) UNIQUE
#  index_invoices_on_invoice_number_and_company_id  (invoice_number,company_id) UNIQUE
#  index_invoices_on_invoice_number_trgm            (invoice_number) USING gin
#  index_invoices_on_issue_date                     (issue_date)
#  index_invoices_on_status                         (status)
#
# Foreign Keys
#
#  fk_rails_...  (client_id => clients.id)
#  fk_rails_...  (company_id => companies.id)
#
require "rails_helper"

RSpec.describe Invoice, type: :model do
  subject(:invoice) { build(:invoice) }

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
      it { is_expected.to validate_numericality_of(:tax).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:amount_paid).is_greater_than_or_equal_to(0) }
      it { is_expected.to validate_numericality_of(:discount).is_greater_than_or_equal_to(0) }

      %i[amount outstanding_amount amount_due].each do |attribute|
        it "#{attribute} should not be negative" do
          plain_invoice = build(:invoice, attribute => -1)
          allow(plain_invoice).to receive(:totals_recalculation_needed?).and_return(false)

          expect(plain_invoice).to be_invalid
          expect(plain_invoice.errors[attribute]).to include("must be greater than or equal to 0")
        end
      end
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

    it "update invoice number" do
      @current_invoice.discard!
      expect(@current_invoice.invoice_number).to start_with(
        "#{Invoice::ARCHIVED_PREFIX}-#{@current_invoice.id}-"
      )
    end

    it "reuses invoice number after discard for new invoice" do
      invoice_number = @current_invoice.invoice_number
      @current_invoice.discard!
      new_invoice = create(:invoice, client: @current_invoice.client, company:, invoice_number:)
      expect(new_invoice.invoice_number).to eq(invoice_number)
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

  describe "amount recalculation" do
    let(:company) { create(:company) }
    let(:client) { create(:client, company:) }
    let(:entry_user) { create(:user, current_workspace: company) }
    let(:project) { create(:project, client:) }
    let(:timesheet_entry) { create(:timesheet_entry, user: entry_user, project:) }

    def create_invoice_line_item_for(invoice)
      invoice.invoice_line_items.create!(
        timesheet_entry:,
        name: "Worked hours",
        description: "Tracked work",
        date: Date.current,
        rate: 120,
        quantity: 60
      )
    end

    it "does not recalculate totals when only a non-total field changes" do
      invoice = create(:invoice, company:, client:)
      create_invoice_line_item_for(invoice)
      invoice.update_columns(amount: 250, amount_due: 250, outstanding_amount: 250)

      expect(invoice).not_to receive(:calculate_amounts)

      invoice.update!(reference: "REF2026")
      invoice.reload

      expect(invoice.amount.to_f).to eq(250.0)
      expect(invoice.amount_due.to_f).to eq(250.0)
      expect(invoice.outstanding_amount.to_f).to eq(250.0)
    end

    it "recalculates totals when a line item is created directly" do
      invoice = create(:invoice, company:, client:)

      create_invoice_line_item_for(invoice)
      invoice.reload

      expect(invoice.amount.to_f).to eq(120.0)
      expect(invoice.amount_due.to_f).to eq(120.0)
      expect(invoice.outstanding_amount.to_f).to eq(120.0)
    end

    it "recalculates totals when a line item is updated directly" do
      invoice = create(:invoice, company:, client:)
      line_item = create_invoice_line_item_for(invoice)

      line_item.update!(quantity: 90)
      invoice.reload

      expect(invoice.amount.to_f).to eq(180.0)
      expect(invoice.amount_due.to_f).to eq(180.0)
      expect(invoice.outstanding_amount.to_f).to eq(180.0)
    end

    it "recalculates both invoices when a line item moves between invoices" do
      original_invoice = create(:invoice, company:, client:)
      destination_invoice = create(:invoice, company:, client:)
      line_item = create_invoice_line_item_for(original_invoice)

      line_item.update!(invoice: destination_invoice)
      original_invoice.reload
      destination_invoice.reload

      expect(original_invoice.amount.to_f).to eq(0.0)
      expect(original_invoice.amount_due.to_f).to eq(0.0)
      expect(original_invoice.outstanding_amount.to_f).to eq(0.0)
      expect(destination_invoice.amount.to_f).to eq(120.0)
      expect(destination_invoice.amount_due.to_f).to eq(120.0)
      expect(destination_invoice.outstanding_amount.to_f).to eq(120.0)
    end

    it "keeps zero open balances for paid invoices when line items change directly" do
      invoice = create(:invoice, company:, client:, status: :paid)

      create_invoice_line_item_for(invoice)
      invoice.reload

      expect(invoice.amount.to_f).to eq(120.0)
      expect(invoice.amount_due.to_f).to eq(0.0)
      expect(invoice.outstanding_amount.to_f).to eq(0.0)
    end

    it "recalculates open balances for partially paid invoices when line items change directly" do
      invoice = create(:invoice, company:, client:, amount_paid: 50)

      create_invoice_line_item_for(invoice)
      invoice.reload

      expect(invoice.amount.to_f).to eq(120.0)
      expect(invoice.amount_due.to_f).to eq(70.0)
      expect(invoice.outstanding_amount.to_f).to eq(70.0)
    end

    it "does not mark totals stale when only a non-total line item field changes" do
      invoice = create(:invoice, company:, client:)
      line_item = create_invoice_line_item_for(invoice)

      line_item.update!(name: "Renamed line item")
      invoice.reload

      expect(invoice.totals_stale?).to eq(false)
      expect(invoice.amount.to_f).to eq(120.0)
      expect(invoice.amount_due.to_f).to eq(120.0)
      expect(invoice.outstanding_amount.to_f).to eq(120.0)
    end

    it "updates base currency amounts and audits for foreign-currency direct line item changes" do
      foreign_company = create(:company, base_currency: "USD")
      foreign_client = create(:client, company: foreign_company, currency: "EUR")
      allow(CurrencyConversionService).to receive(:get_exchange_rate).with("EUR", "USD", anything).and_return(1.18)

      invoice = create(:invoice,
        company: foreign_company,
        client: foreign_client,
        currency: "EUR",
        issue_date: Date.current,
        base_currency_amount: 0)

      invoice.invoice_line_items.create!(
        name: "Worked hours",
        description: "Tracked work",
        date: Date.current,
        rate: 120,
        quantity: 60
      )
      invoice.reload

      expect(invoice.amount.to_f).to eq(120.0)
      expect(invoice.base_currency_amount.to_f).to eq(141.6)
      expect(invoice.exchange_rate.to_f).to eq(1.18)
      expect(invoice.exchange_rate_date).to eq(invoice.issue_date)
      expect(invoice.audits.last.audited_changes.keys).to include("amount", "base_currency_amount")
    end
    it "zeroes totals when the last line item is removed" do
      invoice = create(:invoice, company:, client:)
      line_item = create_invoice_line_item_for(invoice)

      invoice.update!(
        invoice_line_items_attributes: [
          {
            id: line_item.id,
            _destroy: "1"
          }
        ]
      )
      invoice.reload

      expect(invoice.amount.to_f).to eq(0.0)
      expect(invoice.amount_due.to_f).to eq(0.0)
      expect(invoice.outstanding_amount.to_f).to eq(0.0)
    end

    it "recalculates totals when a line item is destroyed directly" do
      invoice = create(:invoice, company:, client:)
      line_item = create_invoice_line_item_for(invoice)

      line_item.destroy!
      invoice.reload

      expect(invoice.amount.to_f).to eq(0.0)
      expect(invoice.amount_due.to_f).to eq(0.0)
      expect(invoice.outstanding_amount.to_f).to eq(0.0)
    end

    it "detects and repairs stale totals" do
      invoice = create(:invoice, company:, client:)
      create_invoice_line_item_for(invoice)
      invoice.update_columns(amount: 0, amount_due: 0, outstanding_amount: 0)

      expect(invoice.reload.totals_stale?).to eq(true)

      invoice.sync_totals_from_line_items!
      invoice.reload

      expect(invoice.totals_stale?).to eq(false)
      expect(invoice.amount.to_f).to eq(120.0)
      expect(invoice.amount_due.to_f).to eq(120.0)
      expect(invoice.outstanding_amount.to_f).to eq(120.0)
    end
  end
end
