# frozen_string_literal: true

require "rails_helper"

RSpec.describe Clients::IndexService do
  describe ".process" do
    let(:company) { create(:company) }
    let(:owner) { create(:user, current_workspace_id: company.id) }
    let!(:employment) { create(:employment, company:, user: owner) }
    let!(:client_one) { create(:client, company:, name: "Client One") }
    let!(:client_two) { create(:client, company:, name: "Client Two") }
    let!(:project_one) { create(:project, client: client_one) }
    let!(:project_two) { create(:project, client: client_two) }

    before do
      owner.add_role(:owner, company)
      create(:project_member, project: project_one, user: owner)
      create(:project_member, project: project_two, user: owner)
      create(:timesheet_entry, user: owner, project: project_one, duration: 90, work_date: Date.current)
      create(:timesheet_entry, user: owner, project: project_two, duration: 30, work_date: Date.current)
      create(:invoice, company:, client: client_one, status: :overdue, amount: 100, base_currency_amount: 100)
      create(:invoice, company:, client: client_two, status: :sent, amount: 50, base_currency_amount: 50)
    end

    it "returns aggregated minutes and invoice totals for visible clients" do
      response = described_class.process(company, owner, nil, "week")

      expect(response[:client_details].pluck(:name)).to match_array(["Client One", "Client Two"])
      expect(response[:client_details].pluck(:minutes_spent)).to match_array([90, 30])
      expect(response[:total_minutes]).to eq(120)
      expect(response[:overdue_outstanding_amount]).to eq(
        outstanding: 150.0,
        overdue: 100.0,
        currency: company.base_currency
      )
    end

    it "does not query the latest invoice once per client" do
      latest_invoice_queries = []
      subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |*, payload|
        sql = payload[:sql].to_s.gsub(%r{/\\*.*?\\*/}m, "").squish
        next unless sql.match?(/FROM "invoices"/i)
        next unless sql.match?(/WHERE .*"invoices"\."client_id" = /i)
        next unless sql.match?(/ORDER BY .*"invoices"\."created_at".*LIMIT/i)

        latest_invoice_queries << sql
      end

      described_class.process(company, owner, nil, "week")

      expect(latest_invoice_queries).to be_empty
    ensure
      ActiveSupport::Notifications.unsubscribe(subscriber)
    end

    it "returns the latest kept invoice number from the preloaded invoices" do
      latest_kept_invoice = create(:invoice, company:, client: client_one, created_at: 1.minute.from_now)
      discarded_invoice = create(:invoice, company:, client: client_one, created_at: 2.minutes.from_now)
      discarded_invoice.discard!

      response = described_class.process(company, owner, nil, "week")
      client_details = response[:client_details].find { |details| details[:id] == client_one.id }

      expect(client_details[:previousInvoiceNumber]).to eq(latest_kept_invoice.invoice_number)
    end
  end
end
