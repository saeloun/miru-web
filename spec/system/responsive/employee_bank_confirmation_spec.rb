# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Employee bank account confirmation", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Consultancy") }
  let(:employee) { create(:user, current_workspace: company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: employee, joined_at: nil, resigned_at: nil) }
  let(:console_errors) { [] }

  around { |example| with_forgery_protection { example.run } }

  before do
    create(:employment, company:, user: admin, joined_at: nil, resigned_at: nil)
    employee.add_role(:employee, company)
    admin.add_role(:admin, company)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return(nil)
  end

  after { expect(console_errors).to eq([]) }

  def open_records(actor, width)
    sign_in(actor)
    page.current_window.resize_to(width, 1000)
    expect(page.evaluate_script("window.innerWidth")).to eq(width)
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| console_errors << event }
    visit "/team/#{employee.id}/employee-records?company_id=#{company.id}"
    expect(page).to have_button("Edit employee records")
  end

  def press(name)
    control = find_button(name, exact: true)
    page.scroll_to(control, align: :center)
    control.click
  end

  def saved_account(number)
    expect(page).to have_css("[role='status']", text: "Employee records saved.")
    expect(employment.reload.employee_record.private_details["bank_account_number"]).to eq(number)
    expect(employment.employee_record.private_details).not_to have_key("bank_account_number_confirmation")
  end

  def capture(name, width)
    return unless ENV["EMPLOYEE_BANK_SHOTS"]

    page.scroll_to(find_field("Confirm bank account number"), align: :center)
    area = page.evaluate_script("({x: window.scrollX, y: window.scrollY, width: window.innerWidth, height: window.innerHeight})")
    expect(area.fetch("width")).to eq(width)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    directory = Pathname(ENV.fetch("EMPLOYEE_BANK_SHOTS"))
    FileUtils.mkdir_p(directory)
    page.save_screenshot(directory.join(name), area: area.transform_keys(&:to_sym))
  end

  [["employee", 1440], ["admin", 375]].each do |role, width|
    it "requires independent matching entry for #{role} at #{width}px and preserves unchanged and cleared edits" do
      open_records(public_send(role), width)
      press "Edit employee records"
      expect(page).to have_no_field("Confirm bank account number")
      fill_in "Bank account number", with: "001234567890"
      expect(page).to have_field("Confirm bank account number", with: "")
      expect(page).to have_button("Save employee records", disabled: true)
      expect(employment.reload.employee_record).to be_nil
      fill_in "Confirm bank account number", with: "1234567890"
      expect(page).to have_no_css("[role='alert']", text: "Bank account numbers must match.")
      expect(find_field("Confirm bank account number")["aria-describedby"]).to eq("bank-confirmation-help")
      find_field("Confirm bank account number").send_keys(:tab)
      expect(page).to have_css("[role='alert']", text: "Bank account numbers must match.")
      expect(find_field("Confirm bank account number")["aria-describedby"]).to eq("bank-confirmation-help bank-confirmation-error")
      expect(find_field("Confirm bank account number")["aria-invalid"]).to eq("true")
      expect(page).to have_button("Save employee records", disabled: true)
      capture("bank-confirmation-mismatch-#{width}.png", width)
      fill_in "Confirm bank account number", with: "001234567890"
      expect(page).to have_no_css("[role='alert']", text: "Bank account numbers must match.")
      expect(page).to have_button("Save employee records", disabled: false)
      capture("bank-confirmation-#{width}.png", width)
      press "Save employee records"
      saved_account("001234567890")
      expect(page).to have_content("••••••••7890")
      expect(page).to have_no_text("001234567890")

      press "Edit employee records"
      expect(page).to have_no_field("Confirm bank account number")
      fill_in "Emergency contact name", with: "Synthetic contact"
      press "Save employee records"
      saved_account("001234567890")
      expect(employment.employee_record.private_details["emergency_contact_name"]).to eq("Synthetic contact")

      press "Edit employee records"
      fill_in "Bank account number", with: "009876543210"
      fill_in "Confirm bank account number", with: "009876543210"
      fill_in "Bank account number", with: "009876543211"
      expect(page).to have_field("Confirm bank account number", with: "")
      expect(page).to have_button("Save employee records", disabled: true)
      press "Cancel"
      press "Edit employee records"
      expect(page).to have_field("Bank account number", with: "001234567890")
      expect(page).to have_no_field("Confirm bank account number")
      fill_in "Bank account number", with: "009876543211"
      expect(page).to have_field("Confirm bank account number", with: "")
      fill_in "Confirm bank account number", with: "009876543211"
      press "Save employee records"
      saved_account("009876543211")
      expect(page).to have_content("••••••••3211")

      press "Edit employee records"
      fill_in "Bank account number", with: ""
      expect(page).to have_no_field("Confirm bank account number")
      press "Save employee records"
      saved_account("")
      expect(page).to have_no_text("••••••••3211")
    end
  end

  it "retains the independently confirmed draft after a rejected save" do
    fail_once = true
    allow_any_instance_of(Api::V1::EmployeeRecordsController).to receive(:update).and_wrap_original do |original, *arguments|
      if fail_once
        fail_once = false
        target = original.receiver.send(:find_employment, employee.id)
        original.receiver.send(:authorize, target, :update?, policy_class: EmployeeRecordPolicy)
        original.receiver.render json: { errors: "Synthetic save unavailable" }, status: :service_unavailable
      else
        original.call(*arguments)
      end
    end
    open_records(employee, 375)
    press "Edit employee records"
    fill_in "Bank account number", with: "001234567890"
    fill_in "Confirm bank account number", with: "001234567890"
    press "Save employee records"
    expect(page).to have_css("[role='alert']", text: "Synthetic save unavailable")
    expect(page).to have_field("Bank account number", with: "001234567890")
    expect(page).to have_field("Confirm bank account number", with: "001234567890")
    expect(employment.reload.employee_record).to be_nil
    press "Save employee records"
    saved_account("001234567890")
  end
end
