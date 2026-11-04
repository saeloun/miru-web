# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client listing", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }

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

  it "shows localized client labels in Hindi" do
    client = create(:client, company:, name: "Hindi Client", email: "hindi@example.com")
    create(:client, company:, name: "Other Client", email: "other@example.com")
    user.update!(locale: "hi")
    console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") do |event|
      console_errors << event if event["type"] == "error"
    end

    with_forgery_protection do
      visit "/clients"

      expect(page).to have_current_path("/clients", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("कुल क्लाइंट", wait: 10)
      expect(page).to have_content("सभी क्लाइंट", wait: 10)
      expect(page).to have_button("नया क्लाइंट जोड़ें", wait: 10)
      expect(page).to have_field(placeholder: "क्लाइंट खोजें...", wait: 10)
      expect(page).to have_content("लॉग किए गए घंटे", wait: 10)
      fill_in "क्लाइंट खोजें...", with: "Hindi"
      expect(page).to have_content("Hindi Client")
      expect(page).not_to have_content("Other Client")
      expect(page).to have_content("लोड किए गए 2 क्लाइंट में से 1 मेल खाते क्लाइंट दिखाए जा रहे हैं।", wait: 10)
      [1440, 375].each do |width|
        page.current_window.resize_to(width, 900)
        page.evaluate_async_script(<<~JS)
          const done = arguments[0];
          requestAnimationFrame(() => requestAnimationFrame(() => {
            document.fonts.ready.then(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))))
              .then(done);
          }));
        JS
        expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
        expect(find_button("नया क्लाइंट जोड़ें").evaluate_script("this.getBoundingClientRect().right <= window.innerWidth + 1")).to be(true)
        page.save_screenshot(Rails.root.join("tmp/capybara/clients-hindi-filtered-#{width}.png"), full: true)
      end

      click_button "मेनू खोलें"

      expect(page).to have_content("क्लाइंट आईडी कॉपी करें", wait: 10)
      expect(page).to have_content("विवरण देखें")
      expect(page).to have_content("क्लाइंट संपादित करें")

      find("[role='menuitem']", text: "क्लाइंट हटाएं", wait: 10).click

      expect(page).to have_content("क्या आप वाकई क्लाइंट #{client.name} को हटाना चाहते हैं?", wait: 10)
      expect(page).to have_button("रद्द करें", wait: 10)
      expect(console_errors).to be_empty
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
        expect(page).to have_content("Hours Tracked")
      end
    end
  end

  context "when user is an employee" do
    let(:employee) { create(:user, current_workspace: company) }
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
