# frozen_string_literal: true

require "rails_helper"

RSpec.describe Team::IndexDecorator do
  let(:company) { create(:company) }
  let(:current_user) { create(:user) }
  let(:service) { described_class.new(current_company: company, current_user: current_user, query: query) }
  let(:query) { nil }

  describe "#process" do
    subject { service.process }

    context "with employees and invitations" do
      let!(:employee1) { create(:user, first_name: "John", last_name: "Doe", email: "john@example.com") }
      let!(:employee2) { create(:user, first_name: "Jane", last_name: "Smith", email: "jane@example.com") }
      let!(:employment1) { create(:employment, user: employee1, company: company) }
      let!(:employment2) { create(:employment, user: employee2, company: company) }
      let!(:invitation) { create(:invitation, company: company, recipient_email: "pending@example.com", first_name: "Bob", last_name: "Builder", role: "employee") }

      before do
        employee1.add_role(:employee, company)
        employee2.add_role(:admin, company)
      end

      it "returns combined data structure" do
        result = subject

        expect(result).to have_key(:combined_data)
        expect(result[:combined_data]).to be_an(Array)
      end

      it "includes both employees and invitations" do
        result = subject
        combined_data = result[:combined_data]

        expect(combined_data.size).to eq(3)

        employees = combined_data.select { |item| item[:type] == "employee" }
        invitations = combined_data.select { |item| item[:type] == "invitation" }

        expect(employees.size).to eq(2)
        expect(invitations.size).to eq(1)
      end

      it "formats employee data correctly" do
        result = subject
        employee_data = result[:combined_data].find { |item| item[:email] == "john@example.com" }

        expect(employee_data[:first_name]).to eq("John")
        expect(employee_data[:last_name]).to eq("Doe")
        expect(employee_data[:roles]).to include("employee")
        expect(employee_data[:status]).to eq("active")
        expect(employee_data[:type]).to eq("employee")
        expect(employee_data[:employment_id]).to eq(employment1.id)
      end

      it "formats invitation data correctly" do
        result = subject
        invitation_data = result[:combined_data].find { |item| item[:email] == "pending@example.com" }

        expect(invitation_data[:first_name]).to eq("Bob")
        expect(invitation_data[:last_name]).to eq("Builder")
        expect(invitation_data[:roles]).to eq(["employee"])
        expect(invitation_data[:status]).to eq("pending")
        expect(invitation_data[:type]).to eq("invitation")
      end

      it "sorts data by name" do
        result = subject
        names = result[:combined_data].map { |item| "#{item[:first_name]} #{item[:last_name]}" }

        expect(names).to eq(["Bob Builder", "Jane Smith", "John Doe"])
      end
    end

    context "with search query" do
      let(:query) { "jane" }
      let!(:employee1) { create(:user, first_name: "Jane", last_name: "Doe", email: "jane@example.com") }
      let!(:employee2) { create(:user, first_name: "John", last_name: "Smith", email: "john@example.com") }
      let!(:employment1) { create(:employment, user: employee1, company: company) }
      let!(:employment2) { create(:employment, user: employee2, company: company) }
      let!(:invitation) { create(:invitation, company: company, recipient_email: "jane.builder@example.com", first_name: "Jane", last_name: "Builder") }

      before do
        employee1.add_role(:employee, company)
        employee2.add_role(:employee, company)
      end

      it "filters employees by query" do
        result = subject
        combined_data = result[:combined_data]

        expect(combined_data.size).to eq(2)
        expect(combined_data.pluck(:email)).to contain_exactly("jane@example.com", "jane.builder@example.com")
      end

      it "searches by first name, last name, and email" do
        # Test first name search
        service_first = described_class.new(current_company: company, current_user: current_user, query: "Jane")
        result_first = service_first.process
        expect(result_first[:combined_data].size).to eq(2)

        # Test email search
        service_email = described_class.new(current_company: company, current_user: current_user, query: "john@")
        result_email = service_email.process
        expect(result_email[:combined_data].size).to eq(1)
        expect(result_email[:combined_data].first[:email]).to eq("john@example.com")
      end
    end

    context "with client role employees" do
      let!(:employee) { create(:user) }
      let!(:client_employee) { create(:user) }
      let!(:employment1) { create(:employment, user: employee, company: company) }
      let!(:employment2) { create(:employment, user: client_employee, company: company) }

      before do
        employee.add_role(:employee, company)
        client_employee.add_role(:client, company)
      end

      it "excludes users with only client role" do
        result = subject
        combined_data = result[:combined_data]

        expect(combined_data.size).to eq(1)
        expect(combined_data.first[:id]).to eq(employee.id)
      end
    end

    context "with discarded employments" do
      let!(:employee) { create(:user) }
      let!(:employment) { create(:employment, user: employee, company: company, discarded_at: Time.current) }

      it "excludes discarded employments" do
        result = subject

        expect(result[:combined_data]).to be_empty
      end
    end
  end
end
