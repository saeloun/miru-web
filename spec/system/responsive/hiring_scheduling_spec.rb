# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Interview scheduling", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Scheduling QA") }
  let(:admin) { create(:user, first_name: "Synthetic", last_name: "Admin", current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:interviewer) { create(:user, first_name: "Synthetic", last_name: "Interviewer", current_workspace: company) }
  let!(:staff) { create(:employment, company:, user: interviewer, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => "Synthetic Booking Candidate", "email" => "booking@example.test" }).process
  end
  let(:panel_member) { HiringPanelMember.create!(company:, employment: staff, details: { "expertise" => "Rails" }) }
  let(:round) do
    Hiring::Interviews.new(application:, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid,
      "details" => { "title" => "Technical discussion", "kind" => "Technical", "duration_minutes" => 45,
        "criteria" => "Discuss tests", "preparation" => "Bring a project", "feedback_questions" => ["What did we learn?"] },
      "panel" => [{ "panel_member_id" => panel_member.id, "compensation_access" => false }]
    })
  end

  before do
    admin.add_role(:admin, company)
    interviewer.add_role(:employee, company)
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| @console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| @console_errors << event }
  end

  around do |example|
    original = Api::V1::Hiring::BaseController.allow_forgery_protection
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    with_forgery_protection { example.run }
  ensure
    Api::V1::Hiring::BaseController.allow_forgery_protection = original
  end

  def open_bookings(width: 1440)
    round
    sign_in admin
    page.current_window.resize_to(width, 900)
    visit "/hiring/applications/#{application.id}"
    expect(page).to have_button("Reload screening", disabled: false)
    expect(page).to have_button("Reload saved state", disabled: false)
    click_button "View interview rounds"
    click_button "Manage booking for round 1"
    expect(page).to have_css('section[aria-label="Interview bookings"]')
  end

  def fill_booking(local: "2027-01-15T14:30", zone: "Asia/Kolkata")
    fill_in "Start in candidate's local time", with: local
    fill_in "Candidate time zone", with: zone
    fill_in "Meeting URL", with: "https://meet.example.test/synthetic"
    fill_in "Booking instructions", with: "Contact the hiring team to change the booking"
    fill_in "Feedback due within (hours after interview)", with: "24"
  end

  def existing_booking
    Hiring::Scheduling.new(interview: round, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "interview_version" => round.reload.lock_version, "request_key" => SecureRandom.uuid,
      "starts_local" => "2027-01-15T14:30", "candidate_time_zone" => "Asia/Kolkata", "feedback_hours" => 24,
      "meeting_url" => "https://meet.example.test/synthetic", "booking_instructions" => "Contact the hiring team"
    })
  end

  def screenshot(name)
    return unless ENV["HIRING_SCHEDULING_SHOTS"]

    directory = Rails.root.join(ENV.fetch("HIRING_SCHEDULING_SHOTS"))
    FileUtils.mkdir_p(directory)
    page.save_screenshot(directory.join("#{name}.png"), full: true)
  end

  def calendar_fixture
    { "id" => "synthetic_event", "etag" => '"synthetic-v1"', "summary" => "Synthetic calendar interview", "status" => "confirmed",
      "start" => { "dateTime" => "2027-01-15T09:00:15.123456Z" }, "end" => { "dateTime" => "2027-01-15T09:45:15.123456Z" },
      "attendees" => [{ "email" => application.hiring_candidate.email, "responseStatus" => "accepted" },
        { "email" => interviewer.email, "responseStatus" => "accepted" }], "hangoutLink" => "https://meet.example.test/synthetic" }
  end

  def connected_calendar
    allow_any_instance_of(Calendars::Connection).to receive(:configured?).and_return(true)
    client = Signet::OAuth2::Client.new(access_token: "synthetic-calendar-token", expires_at: 1.hour.from_now)
    allow_any_instance_of(Calendars::Connection).to receive(:authorized_client).and_return(client)
    stub_request(:get, "https://www.googleapis.com/calendar/v3/users/me/calendarList")
      .with(query: hash_including("maxResults" => "20"))
      .to_return(status: 200, headers: { "Content-Type" => "application/json" },
        body: { items: [{ id: "primary", summary: "Synthetic interview calendar" }] }.to_json)
    stub_request(:get, "https://www.googleapis.com/calendar/v3/calendars/primary/events")
      .with(query: hash_including("singleEvents" => "true"))
      .to_return(status: 200, headers: { "Content-Type" => "application/json" }, body: { items: [calendar_fixture] }.to_json)
    stub_request(:get, "https://www.googleapis.com/calendar/v3/calendars/primary/events/synthetic_event")
      .to_return(status: 200, headers: { "Content-Type" => "application/json" }, body: calendar_fixture.to_json)
  end

  def select_calendar_event
    click_button "Import from Google Calendar"
    select "Synthetic interview calendar", from: "Google calendar"
    fill_in "Search from (UTC date)", with: "2027-01-15"
    click_button "Find matching events"
    find("#calendar-event option", text: "Synthetic calendar interview").select_option
    fill_in "Candidate time zone for import", with: "Asia/Kolkata"
    fill_in "Feedback due within (hours after interview)", with: "24"
    fill_in "Booking instructions", with: "Contact the hiring team to reschedule"
  end

  it "explains an unconfigured calendar and keeps manual scheduling available on mobile" do
    allow_any_instance_of(Calendars::Connection).to receive(:configured?).and_return(false)
    open_bookings(width: 375)
    click_button "Import from Google Calendar"
    expect(page).to have_text("Google Calendar is not configured for Miru")
    expect(page).to have_text("You can still record a manual booking")
    screenshot("calendar-fallback-mobile")
    click_button "Close calendar import"
    expect(page).to have_button("Record manual booking", disabled: false)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    expect(@console_errors).to be_empty
  end

  it "imports a selected event on mobile with exact stored instants and a visible candidate zone" do
    connected_calendar
    open_bookings(width: 375)
    select_calendar_event
    expect(page).to have_text("09:00:15.123456Z")
    screenshot("calendar-import-mobile")
    click_button "Import selected event"
    expect(page).to have_text("Calendar booking imported")
    expect(page).to have_text("Google Calendar")
    expect(page).to have_text("Asia/Kolkata")
    expect(round.hiring_interview_bookings.sole.starts_at).to eq(Time.iso8601("2027-01-15T09:00:15.123456Z"))
    screenshot("calendar-booking-imported-mobile")
    click_button "Reschedule booking 1"
    expect(page).to have_field("Start in candidate's local time", with: "")
    expect(page).to have_text("Choose a new local time for this manual replacement")
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    expect(@console_errors).to be_empty
    expect(HiringMessage.count).to eq(0)
  end

  it "retains a stale calendar draft until explicit discard and a new search" do
    connected_calendar
    open_bookings(width: 375)
    select_calendar_event
    round.touch
    click_button "Import selected event"
    expect(page).to have_text("This application, round or booking changed")
    expect(page).to have_field("Feedback due within (hours after interview)", with: "24")
    expect(round.hiring_interview_bookings).to be_empty
    screenshot("calendar-import-stale-mobile")
    click_button "Discard calendar draft and search again"
    click_button "Find matching events"
    find("#calendar-event option", text: "Synthetic calendar interview").select_option
    fill_in "Candidate time zone for import", with: "Asia/Kolkata"
    fill_in "Feedback due within (hours after interview)", with: "24"
    click_button "Import selected event"
    expect(page).to have_text("Calendar booking imported")
    expect(round.hiring_interview_bookings.count).to eq(1)
    expect(@console_errors).to be_empty
  end

  it "retries a lost accepted calendar response with the same request key and no duplicate provider read" do
    provider = connected_calendar
    lost = false
    allow_any_instance_of(Api::V1::Hiring::BookingsController).to receive(:render).and_wrap_original do |original, *args, **options, &block|
      if original.receiver.action_name == "import" && !lost
        lost = true
        original.call(json: { errors: "Synthetic lost response. Retry the same import." }, status: 503)
      else
        original.call(*args, **options, &block)
      end
    end
    open_bookings(width: 375)
    select_calendar_event
    click_button "Import selected event"
    expect(page).to have_text("Synthetic lost response. Retry the same import.")
    expect(page).to have_field("Feedback due within (hours after interview)", with: "24")
    expect(round.hiring_interview_bookings.count).to eq(1)
    click_button "Import selected event"
    expect(page).to have_text("Calendar booking imported")
    expect(round.hiring_interview_bookings.count).to eq(1)
    expect(provider).to have_been_requested.once
    expect(@console_errors).to be_empty
  end

  it "records, reschedules and cancels manual bookings on mobile while preserving prior times" do
    open_bookings(width: 375)
    within('section[aria-label="Interview bookings"]') do
      click_button "Record manual booking"
      fill_booking
      click_button "Save booking"
      expect(page).to have_text("Booking recorded")
      expect(page).to have_text("Asia/Kolkata")
      expect(page).to have_text("14:30")
      expect(page).to have_text("09:00")
      expect(page).to have_button("No-show booking 1", disabled: true)
      screenshot("booking-mobile")
      click_button "Reschedule booking 1"
      fill_in "Start in candidate's local time", with: "2027-01-16T14:30"
      fill_in "Reason", with: "Candidate requested the following day"
      click_button "Save booking"
      expect(page).to have_text("Booking recorded")
      click_button "Cancel booking 2"
      fill_in "Reason", with: "Candidate cancelled this booking"
      click_button "Confirm cancellation"
      expect(page).to have_text("Booking cancelled")
    end
    first, second = round.hiring_interview_bookings.order(:number).to_a
    expect(first).to have_attributes(status: "cancelled", starts_at: Time.utc(2027, 1, 15, 9))
    expect(second).to have_attributes(status: "cancelled", starts_at: Time.utc(2027, 1, 16, 9))
    expect(HiringMessage.count).to eq(0)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    expect(@console_errors).to be_empty
    screenshot("booking-cancelled-mobile")
  end

  it "requires an explicit UTC offset for a repeated local time without losing the draft" do
    open_bookings
    within('section[aria-label="Interview bookings"]') do
      click_button "Record manual booking"
      fill_booking(local: "2027-11-07T01:30", zone: "America/New_York")
      click_button "Save booking"
      expect(page).to have_css('[role="alert"]', text: "occurs twice")
      expect(page).to have_field("Start in candidate's local time", with: "2027-11-07T01:30")
      select "-05:00", from: "UTC offset for repeated time"
      click_button "Save booking"
      expect(page).to have_text("Booking recorded")
      expect(page).to have_text("America/New_York")
      expect(page).to have_text("01:30")
      expect(page).to have_text("06:30")
    end
    expect(round.hiring_interview_bookings.sole.starts_at).to eq(Time.utc(2027, 11, 7, 6, 30))
    expect(@console_errors).to be_empty
    screenshot("booking-dst-overlap")
  end

  it "retains a stale booking draft and requires explicit discard before using newer versions" do
    open_bookings
    within('section[aria-label="Interview bookings"]') do
      click_button "Record manual booking"
      fill_booking
      round.touch
      click_button "Save booking"
      expect(page).to have_css('[role="alert"]', text: "changed")
      expect(page).to have_field("Start in candidate's local time", with: "2027-01-15T14:30")
      expect(round.hiring_interview_bookings).to be_empty
      click_button "Discard draft and reload bookings"
      expect(page).not_to have_field("Start in candidate's local time")
      expect(page).to have_text("No bookings recorded")
    end
    expect(@console_errors).to be_empty
  end

  it "shows the assigned interviewer the candidate zone and removes the meeting link after cancellation" do
    booking = existing_booking
    sign_in interviewer
    page.current_window.resize_to(375, 900)
    visit "/interview-reviews/#{round.id}"
    within('section[aria-label="Interview booking"]') do
      expect(page).to have_text("Asia/Kolkata")
      expect(page).to have_text("14:30")
      expect(page).to have_link("Open meeting", href: "https://meet.example.test/synthetic")
    end
    Hiring::Scheduling.new(interview: round, actor: admin).end!(booking:, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "interview_version" => round.reload.lock_version, "booking_version" => booking.lock_version,
      "action" => "cancel", "reason" => "PRIVATE ADMIN CANCELLATION REASON"
    })
    click_button "Refresh handover"
    within('section[aria-label="Interview booking"]') do
      expect(page).to have_text("Cancelled")
      expect(page).not_to have_link("Open meeting")
    end
    expect(page).not_to have_text("PRIVATE ADMIN CANCELLATION REASON")
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    expect(@console_errors).to be_empty
    screenshot("booking-handover-cancelled")
  end
end
