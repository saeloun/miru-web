# frozen_string_literal: true

require "rails_helper"
require "uri"

RSpec.describe "Consultant bank-change private notice", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Consultancy") }
  let(:consultant) { create(:user, first_name: "Synthetic", last_name: "Consultant", current_workspace: company) }
  let(:owner) { create(:user, current_workspace: company) }
  let(:accounts) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: consultant, joined_at: "2026-01-01", resigned_at: nil) }
  let(:console_errors) { [] }
  let(:run) { PayrollRun.create!(company:, period: Date.current.beginning_of_month, currency: "INR", accounts_reviewer: accounts, final_reviewer: owner) }

  around { |example| travel_to(Time.utc(2026, 11, 9, 12)) { with_forgery_protection { example.run } } }

  before do
    [owner, accounts].each { |actor| create(:employment, company:, user: actor, joined_at: "2026-01-01", resigned_at: nil) }
    owner.add_role(:owner, company)
    accounts.add_role(:book_keeper, company)
    consultant.add_role(:employee, company)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("true")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return(company.id.to_s)
    create(:employee_record, employment:, private_details: { "bank_account_number" => "001111111111", "bank_ifsc" => "SBIN0001234" })
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2026-01-01", monthly_fee: "50000.25",
      hours_per_day: "8", weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Synthetic India entity",
      change_reason: "Synthetic consultant engagement")
    run
    ActionMailer::Base.deliveries.clear
  end

  after { expect(console_errors).to eq([]) }

  def sign_in_at_width(actor, width)
    sign_in(actor)
    page.current_window.resize_to(width, 1000)
    expect(page.evaluate_script("window.innerWidth")).to eq(width)
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| console_errors << event }
  end

  def press(name)
    control = find_button(name, exact: true)
    page.scroll_to(control, align: :center)
    control.click
  end

  def capture_mail(mail, width)
    return unless ENV["BANK_NOTICE_SHOTS"]

    directory = Pathname(ENV.fetch("BANK_NOTICE_SHOTS"))
    FileUtils.mkdir_p(directory)
    path = directory.join("bank-change-notice.txt")
    File.write(path, mail.body.decoded)
    visit "file://#{path}"
    page.current_window.resize_to(width, 1000)
    expect(page.evaluate_script("window.innerWidth")).to eq(width)
    expect(page).to have_text("/payroll")
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    page.save_screenshot(directory.join("bank-change-notice-#{width}.png"))
  end

  it "turns a confirmed self edit into committed generic accounts mail without leaking bank data" do
    sign_in_at_width(consultant, 375)
    visit "/settings/employee-records"
    press "Edit employee records"
    fill_in "Bank account number", with: "009999999999"
    fill_in "Confirm bank account number", with: "009999999999"
    press "Save employee records"
    expect(page).to have_css("[role='status']", text: "Employee records saved.")
    expect(page).to have_text("••••••••9999")
    notices = PayrollBankChangeNotice.order(:id).to_a
    expect(notices.map(&:recipient_id)).to match_array([owner.id, accounts.id])
    expect(notices.map(&:event_id).uniq.length).to eq(1)
    expect(notices.map(&:state)).to eq(%w[queued queued])
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(ActionMailer::Base.delivery_method).to eq(:test)
    notices.each { |notice| PayrollBankChangeNoticeJob.perform_now(notice.id) }
    expect(notices.map { |notice| notice.reload.state }).to eq(%w[sent sent])
    expect(ActionMailer::Base.deliveries.flat_map(&:to)).to match_array([owner.email, accounts.email])
    notices.each { |notice| PayrollBankChangeNoticeJob.perform_now(notice.id) }
    expect(ActionMailer::Base.deliveries.size).to eq(2)
    mail = ActionMailer::Base.deliveries.find { |message| message.to == [accounts.email] }
    text = mail.body.decoded
    ["001111111111", "009999999999", "SBIN0001234", consultant.full_name, "50000.25"].each do |private_value|
      expect(text).not_to include(private_value)
      expect(notices.map(&:attributes).to_json).not_to include(private_value)
    end
    url = URI(text[%r{https?://[^\s]+}])
    expect(url.path).to eq("/payroll")
    expect(url.query).to be_nil
    expect(url.fragment).to be_nil
    [1440, 375].each { |width| capture_mail(mail, width) }
    sign_in_at_width(accounts, 1440)
    visit url.path
    expect(page).to have_current_path("/payroll")
    expect(page).to have_css("h1", text: "Payroll review", exact_text: true)
    link = find_link(href: "/payroll/#{run.id}")
    page.scroll_to(link, align: :center)
    link.click
    expect(page).to have_current_path("/payroll/#{run.id}")
    expect(page).to have_text(consultant.full_name)
  end
end
