# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking - Add Entry", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Acme Client") }
  let(:project) { create(:project, client:, name: "Harvest-style Project") }

  around do |example|
    with_forgery_protection do
      example.run
    end
  end

  before do
    create(:employment, user:, company:)
    create(:project_member, user:, project:)
    user.add_role(:admin, company)
    sign_in(user)
  end

  def switch_to(view)
    target = view.downcase
    expect(page).to have_no_text("Loading...", wait: 15)
    find("button[data-view='#{target}']", wait: 10).click

    case target
    when "week"
      expect(page).to have_css(".week-view[data-view='week']", wait: 10)
      expect(page).to have_button("Last week", wait: 10)
      expect(page).to have_content(/Week of/i, wait: 10)
    when "month"
      expect(page).to have_css(".week-view[data-view='month']", wait: 10)
      expect(page).to have_css("[data-testid='time-nav-prev']", wait: 10)
      expect(page).to have_css("[data-testid='time-nav-next']", wait: 10)
      expect(page).to have_css("[data-testid='time-nav-today']", wait: 10)
    end
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

  def formatted_week_range(anchor_date)
    start_date = anchor_date.beginning_of_week(:monday)
    end_date = start_date + 6.days

    "Week of#{start_date.strftime('%b')} #{start_date.day}to#{end_date.strftime('%b')} #{end_date.day},#{end_date.year}"
  end

  def select_week_day(day_abbreviation)
    button = all("button[aria-label^='Select ']", wait: 10).find do |candidate|
      text = candidate.text.upcase
      label = candidate["aria-label"].to_s.upcase

      text.include?(day_abbreviation.upcase) || label.include?("SELECT #{day_abbreviation.upcase}")
    end

    raise Capybara::ElementNotFound, "Unable to find weekday #{day_abbreviation}" unless button

    button.click
    expect(button["aria-pressed"]).to eq("true")
  end

  def current_selected_long_date
    page.text.match(/\b[A-Z][a-z]+, [A-Z][a-z]+ \d{1,2}, \d{4}\b/)&.to_s
  end

  def current_entry_form_date
    page.text.match(/\b[A-Z][a-z]+, \d{2}[-\/]\d{2}[-\/]\d{4}\b/)&.to_s
  end

  def parse_entry_form_date(display_date)
    _, formatted_date = display_date.split(", ", 2)

    case company.date_format
    when "DD-MM-YYYY"
      Date.strptime(formatted_date, "%d-%m-%Y")
    when "MM/DD/YYYY"
      Date.strptime(formatted_date, "%m/%d/%Y")
    when "DD/MM/YYYY"
      Date.strptime(formatted_date, "%d/%m/%Y")
    else
      Date.strptime(formatted_date, "%m-%d-%Y")
    end
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

    expect do
      click_button "Save Entry"
      expect(page).to have_button("Add Entry", wait: 10)
    end.to change {
      TimesheetEntry.where(
        user:,
        project:,
        note: "Implement timer + clean weekly UX",
        duration: 210
      ).count
    }.by(1)

    expect(page).to have_no_button("Save Entry", wait: 10)
    expect(page).to have_no_field("timeInput", wait: 10)
    expect(page).to have_content("Implement timer + clean weekly UX", wait: 10)
    expect(page).to have_content("03:30", wait: 10)
    within ".weekly-total" do
      expect(page).to have_content("03:30")
    end
    find("[data-testid='time-review-week']", wait: 10).click
    expect(page).to have_content("Implement timer + clean weekly UX", wait: 10)
    expect(page).to have_content("03:30", wait: 10)

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")
    find("[data-testid='time-review-week']", wait: 10).click
    expect(page).to have_content("Implement timer + clean weekly UX", wait: 10)
    expect(page).to have_content("03:30", wait: 10)
  end

  it "restores a running timer after leaving the page and coming back" do
    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    expect(page).to have_button("Start Timer", wait: 10)

    click_button "Start Timer"
    expect(page).to have_css("[data-testid='inline-web-timer']", wait: 10)

    select_radix("Project", project.name)
    fill_in "timer-description-inline", with: "Cross-page restore work"

    visit "/projects"
    expect(page).to have_css("#react-root", wait: 10)

    visit "/time-tracking"

    expect(page).to have_css("[data-testid='inline-web-timer']", wait: 10)
    expect(page).to have_text("Pause", wait: 10)
    expect(page).to have_text(project.name, wait: 10)
    expect(page).to have_field(
      "timer-description-inline",
      with: "Cross-page restore work",
      wait: 10
    )
  end

  it "saves a restored running timer into today's entries" do
    note = "Persisted timer save path"

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)

    page.execute_script(<<~JS)
      localStorage.setItem(
        "miru_timer_state",
        JSON.stringify({
          isRunning: true,
          startTime: Date.now() - 120000,
          elapsedTime: 120000,
          project: "#{project.name}",
          client: "#{client.name}",
          description: "#{note}",
          projectId: #{project.id}
        })
      );
    JS

    visit "/time-tracking"

    expect(page).to have_css("[data-testid='inline-web-timer']", wait: 10)
    expect(page).to have_text("Pause", wait: 10)
    expect(page).to have_text(project.name, wait: 10)
    expect(page).to have_field("timer-description-inline", with: note, wait: 10)

    expect do
      within "[data-testid='inline-web-timer']" do
        click_button "Stop"
      end
      expect(page).to have_text("Save Time Entry", wait: 10)
      click_button "Save Entry"
      expect(page).to have_content("Time entry saved successfully", wait: 10)
      expect(page).to have_button("Start Timer", wait: 10)
    end.to change {
      TimesheetEntry.where(
        user:,
        project:,
        work_date: Date.current,
        note:
      ).count
    }.by(1)

    created_entry = TimesheetEntry.find_by!(
      user:,
      project:,
      work_date: Date.current,
      note:
    )

    expect(created_entry.duration).to eq(2)
  end

  it "keeps the selected day visible when switching between week and month views" do
    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)

    switch_to("Week")
    select_week_day("TUE")
    selected_date = current_selected_long_date

    expect(selected_date).to be_present

    switch_to("Month")
    expect(page).to have_css(".week-view", wait: 10)
    expect(page).to have_content("Month")
    expect(page).to have_content(selected_date, wait: 10)
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

  it "navigates between previous, next, and current month in month view" do
    current_label = Date.current.strftime("%b %Y")
    next_label = Date.current.next_month.strftime("%b %Y")

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Month")
    expect(page).to have_content(current_label, wait: 10)

    find("[data-testid='time-nav-next']", wait: 10).click
    expect(page).to have_content(next_label, wait: 10)

    find("[data-testid='time-nav-prev']", wait: 10).click
    expect(page).to have_content(current_label, wait: 10)

    find("[data-testid='time-nav-today']", wait: 10).click
    expect(page).to have_content(current_label, wait: 10)
  end

  it "keeps restored client and project selections saveable and persists the created entry" do
    entry_note = "Restored storage entry"
    create(
      :timesheet_entry,
      user:,
      project:,
      work_date: Date.current.beginning_of_week(:monday),
      duration: 30,
      note: "Existing week entry"
    )

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")
    select_week_day("TUE")

    page.execute_script(<<~JS)
      localStorage.setItem("client", "#{client.name}");
      localStorage.setItem("project", "#{project.name}");
      localStorage.setItem("projectId", "");
      localStorage.setItem("taskType", "development");
    JS

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")
    select_week_day("TUE")

    click_button "Add Entry"
    target_date = parse_entry_form_date(current_entry_form_date)

    expect(page).to have_button("Last week", wait: 10)
    expect(page).to have_text(/saving to/i, wait: 10)
    expect(page).to have_content(current_entry_form_date)
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
      work_date: Date.current.beginning_of_week(:monday),
      duration: 95,
      note: recent_note
    )

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")
    select_week_day("TUE")

    click_button "Add Entry"
    target_date = parse_entry_form_date(current_entry_form_date)
    expect(page).to have_css("[data-testid='recent-entry-shortcut']", wait: 10)
    first("[data-testid='recent-entry-shortcut']").click

    expect(combobox_for("Client")).to have_text(client.name, wait: 10)
    expect(combobox_for("Project")).to have_text(project.name, wait: 10)
    expect(find("input[name='timeInput']", wait: 10).value).to eq("01:35")
    expect(find("textarea[name='notes']", wait: 10).value).to eq(recent_note)

    expect do
      find("[data-testid='duplicate-last-entry']", wait: 10).click
      expect(page).to have_button("Add Entry", wait: 10)
    end.to change {
      TimesheetEntry.where(
        user:,
        project:,
        work_date: target_date,
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

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")
    click_button "This Week"
    expect(page).to have_content(source_note, wait: 10)
  end

  it "pins a recent shortcut into favorites" do
    recent_note = "Pinned shortcut work"
    create(
      :timesheet_entry,
      user:,
      project:,
      work_date: Date.current.beginning_of_week(:monday),
      duration: 45,
      note: recent_note
    )

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")

    click_button "Add Entry"
    expect(page).to have_css("[data-testid='recent-entry-shortcut']", wait: 10)
    first("[data-testid='favorite-entry-toggle']").click

    expect(page).to have_text(/Favorites/i, wait: 10)
    expect(page).to have_css("[data-testid='favorite-entry-shortcut']", wait: 10)
    expect(page).to have_css("[data-testid='favorite-entry-shortcut']", wait: 10)
    expect(page).to have_content("Acme Client / Harvest-style Project · 00:45", wait: 10)
  end

  it "switches to week review and shows entries from multiple days" do
    monday = Date.current.beginning_of_week(:monday)
    wednesday = monday + 2.days

    create(
      :timesheet_entry,
      user:,
      project:,
      work_date: monday,
      duration: 60,
      note: "Monday batch"
    )
    create(
      :timesheet_entry,
      user:,
      project:,
      work_date: wednesday,
      duration: 90,
      note: "Wednesday batch"
    )

    travel_to(wednesday.in_time_zone.change(hour: 12)) do
      visit "/time-tracking"
      expect(page).to have_css("#react-root", wait: 10)
      switch_to("Week")

      find("[data-testid='time-review-week']", wait: 10).click

      expect(page).to have_content("Monday batch", wait: 10)
      expect(page).to have_content("Wednesday batch", wait: 10)
      expect(page).to have_content(/Week Total/i, wait: 10)
    end
  end

  it "keeps long notes wrapped inside the review panel" do
    long_note = <<~TEXT.squish
      Today’s tasks (1 April):
      1. Attend issues - https://docs.google.com/spreadsheets/d/jsdnvbsdnlsdnljndscvjbhsadccsdnv-dfjbadshfgsdkjfnkjhf/edit?gid=0#gid=0
      2. Simulate script should accept variable which can set Distribution through variable (Sea food 25%, Vegetarion 30%, etc)
      3. Product view ingredients not showing on UI verify on below rows: https://mydummyapp-staging.herokuapp.com/admin/ops/cook_book/component_versions/342578 https://mydummyapp-staging.herokuapp.com/admin/ops/menus/products/310274 https://mydummyapp-staging.herokuapp.com/admin/ops/menus/menus/20215
      4. Validate all Meals -> Products has primary protein set
    TEXT

    create(
      :timesheet_entry,
      user:,
      project:,
      work_date: Date.current.beginning_of_week(:monday),
      duration: 90,
      note: long_note
    )

    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    switch_to("Week")

    expect(page).to have_content("Today’s tasks", wait: 10)
    expect(page).to have_css("[data-testid='time-entry-note']", wait: 10)

    note_overflows = page.evaluate_script(<<~JS)
      Array.from(document.querySelectorAll('[data-testid="time-entry-note"]'))
        .some((element) => element.scrollWidth > element.clientWidth + 1)
    JS

    expect(note_overflows).to be(false)
  end
end
