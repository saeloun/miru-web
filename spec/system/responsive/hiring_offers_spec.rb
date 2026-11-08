# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring offer journeys", type: :system, js: true do
  include_context "interview message records"
  let(:company) { create(:company, name: "Synthetic Offers QA") }
  let(:candidate_name) { "Synthetic Offer Candidate" }

  before do
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
    sign_in admin
    decision_service = Hiring::Decisions.new(application:, actor: admin)
    decision, = decision_service.create!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "request_key" => SecureRandom.uuid, "outcome" => "pass", "reason" => "PRIVATE SELECTION REASON", "owner_employment_id" => nil, "follow_up_on" => nil })
    decision_service.finalize!(decision:, attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version, "decision_version" => decision.lock_version })
  end

  around do |example|
    original = Api::V1::Hiring::BaseController.allow_forgery_protection
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    Api::V1::Hiring::BaseController.allow_forgery_protection = original
  end

  after { expect(@console_errors).to eq([]) }

  def open_offers(width: 1440)
    page.current_window.resize_to(width, 900)
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    click_button "Review offers"
    expect(page).to have_text("New offer draft")
  end

  def save_terms
    select "Consultant", from: "Offer engagement"
    fill_in "Offer title", with: "Software consultant"
    fill_in "Approved compensation amount", with: "125000.50"
    fill_in "Offer currency", with: "INR"
    select "Monthly", from: "Compensation period"
    fill_in "Proposed joining date", with: "2026-11-20"
    fill_in "Offer expiry date", with: "2026-11-10"
    click_button "Save offer draft"
    expect(page).to have_text("Offer draft saved")
  end

  def issue_saved
    check "I approve these saved terms and the private offer link"
    click_button "Approve and issue private offer"
    expect(page).to have_text("Private offer issued. Email requires a separate preview and confirmation.")
    company.hiring_offers.sole
  end

  def capture(name)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    return unless ENV["HIRING_OFFER_SHOTS"]

    folder = Rails.root.join(ENV.fetch("HIRING_OFFER_SHOTS"))
    FileUtils.mkdir_p(folder)
    page.save_screenshot(folder.join("#{name}.png"), full: true)
  end

  it "requires saved terms and keyboard approval, then lets only the private candidate page accept" do
    open_offers
    save_terms
    expect(page).to have_button("Approve and issue private offer", disabled: true)
    fill_in "Approved compensation amount", with: "135000.50"
    expect(page).to have_field("I approve these saved terms and the private offer link", disabled: true)
    click_button "Save offer draft"
    expect(page).to have_text("Offer draft saved")
    find_field("I approve these saved terms and the private offer link").native.node.focus
    page.driver.browser.keyboard.type(:space)
    click_button "Approve and issue private offer"
    expect(page).to have_text("Private offer issued. Email requires a separate preview and confirmation.")
    capture("offer-issued-desktop")
    record = company.hiring_offers.sole
    expect(record.details.fetch("amount")).to eq("135000.50")
    expect(HiringMessage.count).to eq(0)
    visit "/hiring-offer##{record.access_token}"
    expect(page).to have_text("135000.50 INR / monthly")
    expect(page).not_to have_text("PRIVATE")
    expect(page).not_to have_text("Screening")
    expect(page).not_to have_text("Internal notes")
    expect(page).to have_current_path("/hiring-offer", ignore_query: true)
    expect(page).to have_button("Accept offer", disabled: true)
    check "I have reviewed these offer terms"
    click_button "Accept offer"
    expect(page).to have_text("Your acceptance is recorded")
    expect(record.reload.state).to eq("accepted")
    capture("offer-accepted-desktop")
  end

  it "lets a candidate decline on mobile without exposing internal data or starting onboarding" do
    open_offers(width: 375)
    save_terms
    record = issue_saved
    visit "/hiring-offer##{record.access_token}"
    expect(page).to have_text("125000.50 INR / monthly")
    check "I have reviewed these offer terms"
    click_button "Decline offer"
    expect(page).to have_text("Your decline is recorded")
    expect(record.reload.state).to eq("declined")
    expect(application.reload.stage).to eq("offer")
    expect(EmployeeRecord.count).to eq(0)
    capture("offer-declined-mobile")
  end

  it "preserves unsaved terms after a stale save instead of silently overwriting them" do
    open_offers(width: 375)
    save_terms
    record = company.hiring_offers.sole
    record.update!(details: record.details.merge("amount" => "150000.00"))
    fill_in "Approved compensation amount", with: "160000.00"
    click_button "Save offer draft"
    expect(page).to have_css('[role="alert"]', text: "changed")
    expect(page).to have_field("Approved compensation amount", with: "160000.00")
    expect(page).to have_button("Approve and issue private offer", disabled: true)
    expect(record.reload.details.fetch("amount")).to eq("150000.00")
    capture("offer-stale-draft-mobile")
  end

  it "clears all private terms when an already-open candidate link is revoked" do
    open_offers(width: 375)
    save_terms
    record = issue_saved
    visit "/hiring-offer##{record.access_token}"
    expect(page).to have_text("125000.50 INR / monthly")
    Hiring::Offers.new(application:, actor: admin).revoke!(offer: record, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "offer_version" => record.reload.lock_version })
    click_button "Reload offer"
    expect(page).to have_css('[role="alert"]', text: "unavailable")
    expect(page).not_to have_text("125000.50")
    expect(page).not_to have_text(candidate_name)
    expect(page).not_to have_button("Accept offer")
    capture("offer-revoked-mobile")
  end

  it "recovers an accepted but lost Admin response with the unchanged creation identity" do
    open_offers(width: 375)
    lost = false
    allow_any_instance_of(Api::V1::Hiring::OffersController).to receive(:render_offer).and_wrap_original do |original, record, **options|
      if !lost && options[:status] == 201
        lost = true
        original.receiver.render(json: { errors: "Synthetic response lost after persistence" }, status: 503)
      else
        original.call(record, **options)
      end
    end
    select "Consultant", from: "Offer engagement"
    fill_in "Offer title", with: "Software consultant"
    fill_in "Approved compensation amount", with: "125000.50"
    fill_in "Offer currency", with: "INR"
    fill_in "Proposed joining date", with: "2026-11-20"
    fill_in "Offer expiry date", with: "2026-11-10"
    click_button "Save offer draft"
    expect(page).to have_button("Retry unchanged offer request")
    expect(page).to have_field("Approved compensation amount", with: "125000.50", disabled: true)
    click_button "Retry unchanged offer request"
    expect(page).to have_text("Offer draft saved")
    expect(company.hiring_offers.count).to eq(1)
    capture("offer-recovered-mobile")
  end

  it "clears candidate identity and private siblings after an Admin offer denial" do
    open_offers
    save_terms
    allow_any_instance_of(Api::V1::Hiring::OffersController).to receive(:index).and_raise(Pundit::NotAuthorizedError)
    click_button "Discard edits and reload offers"
    expect(page).to have_css('[role="alert"]', text: /authorized|Forbidden/i)
    expect(page).not_to have_text(candidate_name)
    expect(page).not_to have_text("PRIVATE ADMIN NOTE")
    expect(page).not_to have_field("Approved compensation amount")
    capture("offer-permission-denied-desktop")
  end

  it "recovers a lost candidate acceptance response without recording a second response" do
    open_offers(width: 375)
    save_terms
    record = issue_saved
    visit "/hiring-offer##{record.access_token}"
    expect(page).to have_text("125000.50 INR / monthly")
    lost = false
    allow_any_instance_of(HiringOfferPortalController).to receive(:render).and_wrap_original do |original, *arguments, **options|
      if !lost && options.dig(:json, :offer, :state) == "accepted"
        lost = true
        original.call(json: { errors: "Synthetic response lost after acceptance" }, status: 503)
      else
        original.call(*arguments, **options)
      end
    end
    check "I have reviewed these offer terms"
    click_button "Accept offer"
    expect(page).to have_button("Retry unchanged response")
    expect(record.reload.state).to eq("accepted")
    version = record.lock_version
    expect(page).to have_button("Accept offer", disabled: true)
    click_button "Retry unchanged response"
    expect(page).to have_text("Your acceptance is recorded")
    expect(record.reload.lock_version).to eq(version)
    expect(page).not_to have_button("Accept offer")
    capture("offer-response-recovered-mobile")
  end
end
