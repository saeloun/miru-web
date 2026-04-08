# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client listing", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "displays the clients page" do
    with_forgery_protection do
      visit "/clients"

      expect(page).to have_current_path("/clients", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  context "with existing clients" do
    let!(:client_one) { create(:client, company:, name: "Acme Corp", email: "acme@example.com") }
    let!(:client_two) { create(:client, company:, name: "Beta Inc", email: "beta@example.com") }

    it "shows client names on the page" do
      with_forgery_protection do
        visit "/clients"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Acme Corp", wait: 10)
        expect(page).to have_content("Beta Inc")
      end
    end

    it "displays multiple clients in the list" do
      with_forgery_protection do
        visit "/clients"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Acme Corp", wait: 10)
        expect(page).to have_content("Beta Inc")
        expect(page).to have_content("CLIENT", wait: 10)
        expect(page).to have_content("HOURS LOGGED")
      end
    end
  end

  context "when user is an employee" do
    let(:employee) { create(:user, current_workspace_id: company.id) }
    let!(:client) { create(:client, company:, name: "Employee Client") }
    let!(:project) { create(:project, client:, name: "Employee Project") }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      create(:project_member, user: employee, project:)
      sign_in(employee)
    end

    it "cannot access the clients page" do
      with_forgery_protection do
        visit "/clients"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_current_path("/time-tracking", wait: 10)
      end
    end
  end

  context "with overdue and outstanding invoices" do
    let!(:client) { create(:client, company:, name: "Invoice Client") }
    let!(:sent_invoice) do
      create(:invoice, company:, client:, status: :sent, amount: 5000.00, amount_due: 5000.00)
    end
    let!(:overdue_invoice) do
      create(:invoice, company:, client:, status: :overdue, amount: 3000.00, amount_due: 3000.00)
    end

    it "shows overdue and outstanding amount labels" do
      with_forgery_protection do
        visit "/clients"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Invoice Client", wait: 10)
        expect(page).to have_content("OVERDUE", wait: 10)
        expect(page).to have_content("OUTSTANDING")
      end
    end
  end

  context "with hours logged for clients" do
    let!(:client) { create(:client, company:, name: "Logged Hours Client") }
    let!(:project) { create(:project, client:) }

    before do
      create(:project_member, user:, project:)
      create(:timesheet_entry, user:, project:, duration: 120.0, work_date: Date.current)
    end

    it "displays the client with hours logged" do
      with_forgery_protection do
        visit "/clients"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Logged Hours Client", wait: 10)
      end
    end
  end

  context "when no clients exist" do
    it "shows the empty state message" do
      with_forgery_protection do
        visit "/clients"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Looks like there aren't any clients added yet.", wait: 10)
      end
    end
  end

  context "with timeframe selection" do
    let!(:client) { create(:client, company:, name: "Timeframe Client") }
    let!(:project) { create(:project, client:) }

    before do
      create(:project_member, user:, project:)
      create(:timesheet_entry, user:, project:, duration: 60.0, work_date: Date.current)
    end

    it "shows the timeframe selector" do
      with_forgery_protection do
        visit "/clients"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Timeframe Client", wait: 10)
        expect(page).to have_css("#timeFrame", wait: 10)
      end
    end
  end
end
