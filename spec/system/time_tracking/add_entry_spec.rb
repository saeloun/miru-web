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

  def combobox_for(label)
    field = find("label", text: label, exact_text: true, wait: 10)
      .find(:xpath, "./ancestor::div[contains(@class, 'space-y-2')][1]")

    field.find("[role='combobox']", wait: 10)
  end

  def select_radix(label, value)
    combobox_for(label).click
    expect(page).to have_css("[role='listbox']", wait: 10)
    find("[role='option']", text: value, match: :first, wait: 10).click
    expect(combobox_for(label)).to have_text(value, wait: 10)
  end

  def formatted_entry_date(date)
    formatted_date =
      case company.date_format
      when "DD-MM-YYYY"
        date.strftime("%d-%m-%Y")
      when "MM/DD/YYYY"
        date.strftime("%m/%d/%Y")
      when "DD/MM/YYYY"
        date.strftime("%d/%m/%Y")
      else
        date.strftime("%m-%d-%Y")
      end

    "#{date.strftime('%A')}, #{formatted_date}"
  end

  def formatted_week_range(anchor_date)
    start_date = anchor_date.beginning_of_week(:monday)
    end_date = start_date + 6.days

    "Week of#{start_date.strftime('%b')} #{start_date.day}to#{end_date.strftime('%b')} #{end_date.day},#{end_date.year}"
  end

  it "adds a time entry from week view with project, duration, and notes" do
    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    expect(page).to have_button("Start Timer", wait: 10)
    switch_to("Week")
    expect(page).to have_button("Last week", wait: 10)
    expect(page).to have_content(/Week of/i, wait: 10)

    click_button "Add Entry"
    expect(page).to have_css(".weekly-entries", wait: 10)
    expect(page).to have_text(/saving to/i, wait: 10)

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

  it "keeps the selected day visible when switching between week and month views" do
    target_date = Date.current

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)

    switch_to("Week")
    target_button_label = "Select #{target_date.strftime('%a, %b %-d')}"
    find("button[aria-label^='#{target_button_label}']", wait: 10).click
    expect(page).to have_content(target_date.strftime("%A, %B %-d, %Y"), wait: 10)

    switch_to("Month")
    expect(page).to have_css(".week-view", wait: 10)
    expect(page).to have_content("Month")
    expect(page).to have_content(target_date.strftime("%A, %B %-d, %Y"), wait: 10)
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

  it "keeps restored client and project selections saveable and persists the created entry" do
    target_date = Date.current.beginning_of_week(:monday).next_day
    target_button_label = "Select #{target_date.strftime('%a, %b %-d')}"
    entry_note = "Restored storage entry"
    create(
      :timesheet_entry,
      user:,
      project:,
      work_date: target_date.beginning_of_week(:monday),
      duration: 30,
      note: "Existing week entry"
    )

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")

    page.execute_script(<<~JS)
      localStorage.setItem("client", "#{client.name}");
      localStorage.setItem("project", "#{project.name}");
      localStorage.setItem("projectId", "");
      localStorage.setItem("taskType", "development");
    JS

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")

    find("button[aria-label^='#{target_button_label}']", wait: 10).click
    click_button "Add Entry"

    expect(page).to have_button("Last week", wait: 10)
    expect(page).to have_text(/saving to/i, wait: 10)
    expect(page).to have_content(formatted_entry_date(target_date))
    expect(combobox_for("Client")).to have_text(client.name, wait: 10)
    expect(combobox_for("Project")).to have_text(project.name, wait: 10)
    expect(page).to have_button("Save Entry", disabled: true)

    fill_in "timeInput", with: "01:00"
    fill_in "notes", with: entry_note

    expect(page).to have_button("Save Entry", disabled: false, wait: 10)
    expect do
      click_button "Save Entry"
      expect(page).to have_button("Add Entry", wait: 10)
    end.to change {
      TimesheetEntry.where(
        user:,
        project:,
        work_date: target_date,
        note: entry_note
      ).count
    }.by(1)

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")
    find("button[aria-label^='#{target_button_label}']", wait: 10).click

    created_entry = TimesheetEntry.find_by!(
      user:,
      project:,
      work_date: target_date,
      note: entry_note
    )
    expect(created_entry.duration).to eq(60)
  end

  it "replaces a stale restored project with a valid project for the selected client" do
    other_client = create(:client, company:, name: "Beta Client")
    other_project = create(:project, client: other_client, name: "Beta Project")
    create(:project_member, user:, project: other_project)

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")

    page.execute_script(<<~JS)
      localStorage.setItem("client", "#{client.name}");
      localStorage.setItem("project", "#{other_project.name}");
      localStorage.setItem("projectId", "0");
      localStorage.setItem("duration", "02:00");
      localStorage.setItem("note", "Recovered stale project selection");
      localStorage.setItem("taskType", "development");
    JS

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")
    click_button "Add Entry"

    expect(combobox_for("Client")).to have_text(client.name, wait: 10)
    expect(combobox_for("Project")).to have_text(project.name, wait: 10)
    expect(find("input[name='timeInput']", wait: 10).value).to eq("02:00")
    expect(find("textarea[name='notes']", wait: 10).value).to eq(
      "Recovered stale project selection"
    )
    expect(page).to have_button("Save Entry", disabled: false, wait: 10)
  end

  it "jumps to the prior week and keeps the save target in sync" do
    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")

    original_range = find(".week-view h2", wait: 10).text
    expected_previous_range = formatted_week_range(Date.current - 1.week)
    click_button "Last week"

    expect(page).to have_css(".week-view h2", wait: 10)
    expect(find(".week-view h2").text).not_to eq(original_range)
    expect(find(".week-view h2").text.delete(" ")).to eq(
      expected_previous_range.delete(" ")
    )

    click_button "Add Entry"

    expect(page).to have_text(/saving to/i, wait: 10)
    expect(find("button[aria-pressed='true']", wait: 10)).to have_text(
      /selected/i
    )
  end

  it "prefills the form from a recent shortcut and duplicates the last entry into the selected day" do
    recent_note = "Recent shortcut work"
    create(
      :timesheet_entry,
      user:,
      project:,
      work_date: Date.current - 1.day,
      duration: 95,
      note: recent_note
    )

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")

    click_button "Add Entry"
    expect(page).to have_css("[data-testid='recent-entry-shortcut']", wait: 10)
    first("[data-testid='recent-entry-shortcut']").click

    expect(combobox_for("Client")).to have_text(client.name, wait: 10)
    expect(combobox_for("Project")).to have_text(project.name, wait: 10)
    expect(find("input[name='timeInput']", wait: 10).value).to eq("01:35")
    expect(find("textarea[name='notes']", wait: 10).value).to eq(recent_note)

    expect do
      find("[data-testid='duplicate-last-entry']", wait: 10).click
      expect(page).to have_content(recent_note, wait: 10)
    end.to change {
      TimesheetEntry.where(
        user:,
        project:,
        work_date: Date.current,
        note: recent_note
      ).count
    }.by(1)
  end

  it "copies last week's entries into the current week" do
    source_note = "Copied from last week"
    source_date = Date.current.beginning_of_week(:monday) - 5.days
    target_date = source_date + 7.days

    create(
      :timesheet_entry,
      user:,
      project:,
      work_date: source_date,
      duration: 120,
      note: source_note
    )

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")

    expect do
      find("[data-testid='copy-last-week']", wait: 10).click
      expect(page).to have_content("Copied 1 entries from last week", wait: 10)
    end.to change {
      TimesheetEntry.where(
        user:,
        project:,
        work_date: target_date,
        note: source_note
      ).count
    }.by(1)

    target_button_label = "Select #{target_date.strftime('%a, %b %-d')}"
    find("button[aria-label^='#{target_button_label}']", wait: 10).click
    expect(page).to have_content(source_note, wait: 10)
  end
end
