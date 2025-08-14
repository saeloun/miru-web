# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::ClientRevenues::ReportDecorator do
  let(:company) { create(:company) }
  let(:client1) { create(:client, company: company) }
  let(:client2) { create(:client, company: company) }
  let(:project1) { create(:project, client: client1) }
  let(:project2) { create(:project, client: client2) }

  let(:params) { {} }
  let(:service) { described_class.new(params, company) }

  describe "#process" do
    subject { service.process }

    context "with invoices and timesheet data" do
      before do
        # Mark projects as billable
        project1.update!(billable: true)
        project2.update!(billable: true)

        # Create invoices for client1
        create(:invoice, client: client1, company: company, amount: 1000, status: "paid", issue_date: Date.current)
        create(:invoice, client: client1, company: company, amount: 500, status: "sent", issue_date: Date.current)

        # Create invoices for client2
        create(:invoice, client: client2, company: company, amount: 750, status: "overdue", issue_date: Date.current)

        # Create timesheet entries
        create(:timesheet_entry, project: project1, duration: 120, work_date: Date.current)
        create(:timesheet_entry, project: project2, duration: 60, work_date: Date.current)
      end

      it "returns client revenue data" do
        result = subject

        expect(result).to have_key(:client_revenues)
        expect(result).to have_key(:summary)
        expect(result).to have_key(:filters)
      end

      it "calculates correct revenue totals" do
        result = subject

        expect(result[:summary][:total_revenue]).to eq(2250)
        expect(result[:summary][:total_paid]).to eq(1000)
        expect(result[:summary][:total_outstanding]).to eq(1250)
      end

      it "includes client details" do
        result = subject
        client_data = result[:client_revenues]

        expect(client_data).to be_an(Array)
        expect(client_data.size).to eq(2)

        client1_data = client_data.find { |c| c[:id] == client1.id }
        expect(client1_data[:revenue]).to eq(1500)
        expect(client1_data[:paid_amount]).to eq(1000)
        expect(client1_data[:outstanding_amount]).to eq(500)
      end

      it "calculates hours logged" do
        result = subject
        client_data = result[:client_revenues]

        client1_data = client_data.find { |c| c[:id] == client1.id }
        expect(client1_data[:hours_logged]).to eq(2.0) # 120 minutes = 2 hours

        client2_data = client_data.find { |c| c[:id] == client2.id }
        expect(client2_data[:hours_logged]).to eq(1.0) # 60 minutes = 1 hour
      end
    end

    context "with date filters" do
      let(:params) { { from: 1.month.ago.to_s, to: Date.current.to_s } }

      before do
        # Mark project as billable
        project1.update!(billable: true)

        # Invoice within date range
        create(:invoice, client: client1, company: company, amount: 1000, status: "sent", issue_date: Date.current)

        # Invoice outside date range
        create(:invoice, client: client1, company: company, amount: 500, status: "sent", issue_date: 2.months.ago)
      end

      it "filters invoices by date range" do
        result = subject

        expect(result[:summary][:total_revenue]).to eq(1000.0)
        expect(result[:filters][:from]).to eq(Date.parse(params[:from]))
        expect(result[:filters][:to]).to eq(Date.parse(params[:to]))
      end
    end

    context "with client filter" do
      let(:params) { { client_ids: [client1.id] } }

      before do
        # Mark projects as billable
        project1.update!(billable: true)
        project2.update!(billable: true)

        create(:invoice, client: client1, company: company, amount: 1000, status: "sent", issue_date: Date.current)
        create(:invoice, client: client2, company: company, amount: 500, status: "sent", issue_date: Date.current)
      end

      it "filters by selected clients" do
        result = subject

        expect(result[:client_revenues].size).to eq(1)
        expect(result[:client_revenues].first[:id]).to eq(client1.id)
        expect(result[:summary][:total_revenue]).to eq(1000.0)
      end
    end

    context "with no revenue data" do
      it "returns empty client revenues" do
        result = subject

        expect(result[:client_revenues]).to be_empty
        expect(result[:summary][:total_revenue]).to eq(0)
      end
    end
  end
end
