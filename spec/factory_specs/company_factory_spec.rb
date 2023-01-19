# frozen_string_literal: true

require "rails_helper"

RSpec.describe Company do
  describe "company_with_invoices" do
    let(:company) { create(:company_with_invoices, length: 10) }

    before do
      company.reload
    end

    context "when invoices are created from a company" do
      it "must create a client" do
        puts "company.id: ", company.id

        puts "\nRelationships:"
        puts "company.clients.count: ", company.clients.count
        puts "company.invoices.count: ", company.invoices.count
        puts "company.clients.first.invoices.count: ", company.clients.first.invoices.count
      end
    end
  end

  describe "client_with_invoices" do
    let(:company) { create(:company) }
    let(:client_1) { create(:client_with_invoices, length: 10, company:) }

    before do
      company.reload
      client_1.reload
    end

    context "when invoices are created from a client" do
      it "must associate with the current company" do
        puts "company.id: ", company.id
        # puts "client_1.id: ", client_1.id
        # puts "client_1.company_id: ", client_1.company_id
        # puts "client_1.invoices.count: ", client_1.invoices.count

        puts "\nRelationships:"
        puts "company.clients.count: ", company.clients.count
        puts "company.invoices.count: ", company.invoices.count
        puts "company.clients.first.invoices.count: ", company.clients.first.invoices.count
      end
    end
  end
end
