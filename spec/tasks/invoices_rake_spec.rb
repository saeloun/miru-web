# frozen_string_literal: true

require "rails_helper"
require "rake"

RSpec.describe "invoices:sync_stale_totals" do
  before(:all) do
    Rails.application.load_tasks if Rake::Task.tasks.empty?
  end

  before do
    Rake::Task["invoices:sync_stale_totals"].reenable
  end

  it "updates only stale invoices" do
    company = create(:company)
    client = create(:client, company:)

    stale_invoice = create(:invoice, company:, client:)
    create(:invoice_line_item, invoice: stale_invoice, rate: 120, quantity: 60)
    stale_invoice.update_columns(amount: 0, amount_due: 0, outstanding_amount: 0)

    fresh_invoice = create(:invoice, company:, client:)
    create(:invoice_line_item, invoice: fresh_invoice, rate: 90, quantity: 60)
    fresh_invoice.reload

    expect {
      Rake::Task["invoices:sync_stale_totals"].invoke
    }.to output(/synced invoice #{stale_invoice.id}.*synced 1 invoices/m).to_stdout

    expect(stale_invoice.reload.amount.to_f).to eq(120.0)
    expect(stale_invoice.amount_due.to_f).to eq(120.0)
    expect(fresh_invoice.reload.amount.to_f).to eq(90.0)
  end
end
