# frozen_string_literal: true

require "rails_helper"

RSpec.describe PgSearchable do
  let(:company) { create(:company) }

  describe "User search" do
    let!(:user1) { create(:user, first_name: "John", last_name: "Doe", email: "john@example.com") }
    let!(:user2) { create(:user, first_name: "Jane", last_name: "Smith", email: "jane@example.com") }

    it "finds users by first name" do
      results = User.search("John")

      expect(results).to include(user1)
      expect(results).not_to include(user2)
    end

    it "finds users by email" do
      results = User.search("jane@")

      expect(results).to include(user2)
      expect(results).not_to include(user1)
    end

    it "is case insensitive" do
      results = User.search("JOHN")

      expect(results).to include(user1)
    end

    it "returns all when query is blank" do
      results = User.search("")

      expect(results).to include(user1, user2)
    end

    it "supports filtering" do
      discarded = create(:user, first_name: "Discarded", discarded_at: Time.current)

      results = User.search("", where: { discarded_at: nil })

      expect(results).to include(user1, user2)
      expect(results).not_to include(discarded)
    end

    it "supports pagination" do
      results = User.search("", page: 1, per: 1)

      expect(results.count).to eq(1)
    end
  end

  describe "Client search" do
    let!(:client1) { create(:client, name: "Apple Inc", email: "apple@example.com", company: company) }
    let!(:client2) { create(:client, name: "Google", email: "google@example.com", company: company) }

    it "finds clients by name" do
      results = Client.search("Apple")

      expect(results).to include(client1)
      expect(results).not_to include(client2)
    end

    it "finds partial matches" do
      results = Client.search("Inc")

      expect(results).to include(client1)
    end
  end

  describe "Project search" do
    let(:client) { create(:client, company: company) }
    let!(:project1) { create(:project, name: "Web App", client: client, billable: true) }
    let!(:project2) { create(:project, name: "Mobile App", client: client, billable: true) }

    it "finds projects by name" do
      results = Project.search("Mobile")

      expect(results).to include(project2)
      expect(results).not_to include(project1)
    end

    it "filters by billable status" do
      non_billable = create(:project, name: "Internal", billable: false, client: client)

      results = Project.search("", where: { billable: true })

      expect(results).to include(project1, project2)
      expect(results).not_to include(non_billable)
    end
  end

  describe "Invoice search" do
    let(:client) { create(:client, company: company) }
    let!(:invoice1) { create(:invoice, invoice_number: "INV-001", status: :sent, client: client, company: company) }
    let!(:invoice2) { create(:invoice, invoice_number: "INV-002", status: :paid, client: client, company: company) }

    it "finds invoices by number" do
      # TODO: implement fuzzy_search method
      # Use higher threshold for more exact matching
      results = Invoice.fuzzy_search("INV-001", threshold: 0.7)

      expect(results).to include(invoice1)
      expect(results).not_to include(invoice2)
    end

    it "filters by status" do
      results = Invoice.search("", where: { status: "paid" })

      expect(results).to include(invoice2)
      expect(results).not_to include(invoice1)
    end
  end

  describe "TimesheetEntry search" do
    let(:client) { create(:client, company: company) }
    let(:project) { create(:project, client: client, billable: true) }
    let(:user) { create(:user) }

    let!(:entry1) { create(:timesheet_entry, note: "Working on feature", project: project, user: user) }
    let!(:entry2) { create(:timesheet_entry, note: "Bug fixing", project: project, user: user) }

    it "finds entries by note" do
      results = TimesheetEntry.search("feature")

      expect(results).to include(entry1)
      expect(results).not_to include(entry2)
    end

    it "filters by bill status" do
      unbilled_entry = create(:timesheet_entry, note: "Unbilled work", bill_status: :unbilled, project: project, user: user)
      non_billable_entry = create(:timesheet_entry, note: "Non-billable work", bill_status: :non_billable, project: project, user: user)

      results = TimesheetEntry.search("", where: { bill_status: "unbilled" })

      expect(results).to include(unbilled_entry)
      expect(results).not_to include(non_billable_entry)
    end
  end

  describe "Expense search" do
    let(:category) { create(:expense_category, company: company) }
    let(:vendor) { create(:vendor, company: company) }

    let!(:expense1) { create(:expense, amount: 100.00, description: "Office supplies", expense_category: category, company: company) }
    let!(:expense2) { create(:expense, amount: 500.00, description: "Software license", expense_category: category, vendor: vendor, company: company) }

    it "finds expenses by description" do
      results = Expense.search("Software")

      expect(results).to include(expense2)
      expect(results).not_to include(expense1)
    end

    it "filters by amount range" do
      results = Expense.search("", where: { amount: 200..600 })

      expect(results).to include(expense2)
      expect(results).not_to include(expense1)
    end
  end

  describe "Invitation search" do
    let(:sender) { create(:user) }

    let!(:invitation1) { create(:invitation, first_name: "Alice", last_name: "Brown", recipient_email: "alice@example.com", company: company, sender: sender) }
    let!(:invitation2) { create(:invitation, first_name: "Bob", last_name: "Green", recipient_email: "bob@example.com", company: company, sender: sender) }

    it "finds invitations by first name" do
      results = Invitation.search("Alice")

      expect(results).to include(invitation1)
      expect(results).not_to include(invitation2)
    end

    it "finds invitations by email" do
      results = Invitation.search("bob@")

      expect(results).to include(invitation2)
      expect(results).not_to include(invitation1)
    end
  end
end
