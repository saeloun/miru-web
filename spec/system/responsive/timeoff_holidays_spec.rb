# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Holiday choices during employee loading", type: :system, js: true do
  it "keeps optional holidays selectable when an employee's data arrives with the timeoff form open" do
    company = create(:company)
    admin = create(:user, current_workspace: company)
    employee = create(:user, current_workspace: company)
    [admin, employee].each { |user| create(:employment, company:, user:, resigned_at: nil) }
    admin.add_role(:admin, company)
    employee.add_role(:employee, company)
    calendar = create(:holiday, company:, year: Date.current.year,
      enable_optional_holidays: true, holiday_types: ["national", "optional"])
    create(:holiday_info, holiday: calendar, category: :optional, date: Date.current)
    project = create(:project, client: create(:client, company:))
    create(:project_member, user: employee, project:)
    create(:timesheet_entry, user: employee, project:, duration: 60, work_date: Date.current)

    started = Queue.new
    release = Queue.new
    held = false
    allow_any_instance_of(TimeTrackingIndexService).to receive(:process).and_wrap_original do |method, *arguments|
      if method.receiver.user.id == employee.id && !held
        held = true
        started << true
        release.pop
      end
      method.call(*arguments)
    end

    sign_in(admin)
    with_forgery_protection do
      visit "/time-tracking"
      click_button "Mark Time Off"
      click_button "Select leave type"
      expect(page).to have_button("Optional Holiday")
      click_button "Cancel"
      find("button[role='combobox']", text: admin.full_name, exact_text: true).click
      find("[role='option']", text: employee.full_name, exact_text: true).click
      Timeout.timeout(5) { started.pop }
      click_button "Mark Time Off"
      click_button "Select leave type"
      expect(page).to have_button("Optional Holiday")

      release << true
      expect(page).to have_css(".weekly-total", text: "01:00")
      expect(page).to have_button("Optional Holiday", count: 1)
    end
  ensure
    release << true if release
  end
end
