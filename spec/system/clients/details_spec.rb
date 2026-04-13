# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client details", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company, locale: "hi") }
  let(:client) do
    create(
      :client,
      company:,
      name: "Hindi Detail Client",
      phone: "+91 9876543210"
    )
  end
  let!(:invoice) do
    create(
      :invoice,
      company:,
      client:,
      status: :overdue,
      amount: 1000,
      amount_due: 1000
    )
  end

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "shows localized client details actions in Hindi" do
    with_forgery_protection do
      visit "/clients/#{client.id}"

      expect(page).to have_current_path("/clients/#{client.id}", wait: 10)
      expect(page).to have_content("Hindi Detail Client", wait: 10)
      expect(page).to have_content("इस क्लाइंट में अभी तक कोई प्रोजेक्ट नहीं जोड़ा गया है।", wait: 10)
      expect(page).to have_button("प्रोजेक्ट जोड़ें", wait: 10)

      find("#kebabMenu").click

      expect(page).to have_content("प्रोजेक्ट जोड़ें", wait: 10)
      expect(page).to have_content("भुगतान अनुस्मारक", wait: 10)
      expect(page).to have_content("संपर्क जोड़ें / देखें", wait: 10)
      expect(page).to have_content("संपादित करें", wait: 10)
      expect(page).to have_content("हटाएं", wait: 10)

      find("button[aria-label='क्लाइंट विवरण']", wait: 10).click
      expect(page).to have_content("क्लाइंट विवरण", wait: 10)
      expect(page).to have_content("पता", wait: 10)
      expect(page).to have_content("फ़ोन नंबर", wait: 10)
      find("body").send_keys(:escape)
      expect(page).to have_no_content("क्लाइंट विवरण", wait: 10)

      find("#kebabMenu").click
      click_on("भुगतान अनुस्मारक")
      expect(page).to have_content("भुगतान अनुस्मारक भेजें", wait: 10)
      expect(page).to have_content("1 इनवॉइस चयनित", wait: 10)
      expect(page).to have_button("जारी रखें", wait: 10)
      click_button("जारी रखें")
      expect(page).to have_content("ईमेल पूर्वावलोकन", wait: 10)
      expect(page).to have_content("प्राप्तकर्ता ईमेल आईडी", wait: 10)
      expect(page).to have_content("विषय", wait: 10)
      expect(page).to have_content("संदेश", wait: 10)
      expect(page).to have_link("इनवॉइस देखें", wait: 10)
    end
  end

  it "shows localized payment reminder actions in Hindi on mobile" do
    with_forgery_protection do
      page.current_window.resize_to(390, 844)
      visit "/clients/#{client.id}"

      expect(page).to have_current_path("/clients/#{client.id}", wait: 10)
      expect(page).to have_content("Hindi Detail Client", wait: 10)

      find("#kebabMenu").click
      expect(page).to have_content("भुगतान अनुस्मारक", wait: 10)
      find("li", text: "भुगतान अनुस्मारक", match: :first).click

      expect(page).to have_content("भुगतान अनुस्मारक भेजें", wait: 10)
      expect(page).to have_content("1 इनवॉइस चयनित", wait: 10)
      expect(page).to have_content("इनवॉइस नंबर", wait: 10)
      expect(page).to have_content("जारी तिथि/ देय तिथि", wait: 10)
      expect(page).to have_content("स्थिति/ राशि", wait: 10)
      expect(page).to have_button("जारी रखें", wait: 10)
      click_button("जारी रखें")
      expect(page).to have_content("ईमेल पूर्वावलोकन", wait: 10)
      expect(page).to have_content("प्राप्तकर्ता ईमेल आईडी", wait: 10)
      expect(page).to have_content("विषय", wait: 10)
      expect(page).to have_content("संदेश", wait: 10)
      expect(page).to have_link("इनवॉइस देखें", wait: 10)
    end
  end

  it "shows localized project table headers in Hindi" do
    create(:project, client:, name: "Hindi Project")

    with_forgery_protection do
      visit "/clients/#{client.id}"

      expect(page).to have_current_path("/clients/#{client.id}", wait: 10)
      expect(page).to have_content("Hindi Project", wait: 10)
      expect(page).to have_content("प्रोजेक्ट", wait: 10)
      expect(page).to have_content("टीम", wait: 10)
      expect(page).to have_content("लॉग किए गए घंटे", wait: 10)
    end
  end

  it "shows localized contacts modal actions in Hindi" do
    contact_user = create(:user, current_workspace: company)
    create(:client_member, client:, company:, user: contact_user)

    with_forgery_protection do
      visit "/clients/#{client.id}"

      expect(page).to have_current_path("/clients/#{client.id}", wait: 10)
      find("#kebabMenu").click
      click_on("संपर्क जोड़ें / देखें")

      expect(page).to have_content("संपर्क जोड़ें", wait: 10)
      expect(page).to have_content(contact_user.email, wait: 10)

      find("button[aria-label='संपर्क हटाएं']", match: :first).click

      expect(page).to have_content("संपर्क हटाएं", wait: 10)
      expect(
        page
      ).to have_content(
        "क्या आप वाकई संपर्क #{contact_user.email} को हटाना चाहते हैं? यह क्रिया वापस नहीं की जा सकती।",
        wait: 10
      )
      expect(page).to have_button("रद्द करें", wait: 10)
      expect(page).to have_button("हटाएं", wait: 10)
    end
  end
end
