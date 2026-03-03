# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking - Add Entry", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Acme Client") }
  let(:project) { create(:project, client:, name: "Harvest-style Project") }

  before do
    create(:employment, user:, company:)
    create(:project_member, user:, project:)
    user.add_role(:admin, company)
    sign_in(user)
  end

  def switch_to(view)
    target = view.downcase
    find("button[data-view='#{target}']", wait: 10).click
    expect(page).to have_css("div[data-view='#{target}']", wait: 10)
  end

  def select_radix(label, value)
    find("button[aria-label='#{label}']", match: :first).click
    find("[role='option']", text: value, match: :first, wait: 10).click
  end

  it "adds a time entry from week view with project, duration, and notes" do
    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    expect(page).to have_button("Start Timer", wait: 10)
    switch_to("Week")

    click_button "Add Entry"
    expect(page).to have_css(".weekly-entries", wait: 10)

    select_radix("Client", client.name)
    select_radix("Project", project.name)

    fill_in "timeInput", with: "03:30"
    fill_in "notes", with: "Implement timer + clean weekly UX"
    click_button "Save Entry"

    expect(page).to have_content("Harvest-style Project", wait: 10)
    expect(page).to have_content("Implement timer + clean weekly UX")

    within ".weekly-total" do
      expect(page).to have_content("03:30").or have_content("3:30")
    end
  end

  it "keeps entries visible when switching between week, day and month views" do
    entry = create(
      :timesheet_entry,
      user:,
      project:,
      work_date: Date.current,
      duration: 150,
      note: "Cross-view continuity"
    )

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)

    switch_to("Week")
    expect(page).to have_content(entry.note, wait: 10)

    switch_to("Day")
    expect(page).to have_content(entry.note, wait: 10)

    switch_to("Month")
    expect(page).to have_css(".week-view", wait: 10)
    expect(page).to have_content("Month")
    expect(page).to have_content("Cross-view continuity")
  end

  it "shows selected day total in month view and allows adding entry from the same screen" do
    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Month")

    click_button "Add Entry"
    select_radix("Client", client.name)
    select_radix("Project", project.name)
    fill_in "timeInput", with: "01:15"
    fill_in "notes", with: "Monthly planning block"
    click_button "Save Entry"

    expect(page).to have_content("Monthly planning block", wait: 10)
    expect(page).to have_content("Harvest-style Project")
  end
end
