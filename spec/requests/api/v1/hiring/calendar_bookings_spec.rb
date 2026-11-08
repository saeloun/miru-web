# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring calendar bookings", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:interviewer) { create(:user, current_workspace: company) }
  let!(:staff) { create(:employment, company:, user: interviewer, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email }).process
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
  let(:root) { "/api/v1/hiring/applications/#{application.id}/interviews/#{round.id}" }
  let(:google_events_url) { "https://www.googleapis.com/calendar/v3/calendars/primary/events" }
  let(:event) do
    { "id" => "synthetic_event", "etag" => '"synthetic-v1"', "summary" => "Synthetic technical interview", "status" => "confirmed",
      "start" => { "dateTime" => "2027-01-15T09:00:15.123456Z" }, "end" => { "dateTime" => "2027-01-15T09:45:15.123456Z" },
      "attendees" => [{ "email" => application.hiring_candidate.email, "responseStatus" => "accepted" },
        { "email" => interviewer.email, "responseStatus" => "needsAction" }], "hangoutLink" => "https://meet.example.test/synthetic" }
  end

  before do
    admin.add_role(:admin, company)
    interviewer.add_role(:employee, company)
    sign_in admin
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("GOOGLE_CLIENT_ID", "").and_return("synthetic-client")
    allow(ENV).to receive(:fetch).with("GOOGLE_CLIENT_SECRET", "").and_return("synthetic-secret")
  end

  def json_reply(body, status: 200)
    { status:, headers: { "Content-Type" => "application/json" }, body: body.to_json }
  end

  def connect_calendar
    stub_request(:post, "https://oauth2.googleapis.com/token").to_return(json_reply(
      { access_token: "synthetic-token", token_type: "Bearer", expires_in: 3600 }
    ))
    get api_v1_redirect_path
    state = Rack::Utils.parse_query(URI.parse(response.parsed_body.fetch("url")).query).fetch("state")
    get api_v1_callback_path, params: { code: "synthetic-code", state: }
    expect(response).to redirect_to(api_v1_calendars_path)
  end

  def attributes(**changes)
    round
    { company_id: company.id, application_version: application.reload.lock_version, interview_version: round.reload.lock_version,
      request_key: SecureRandom.uuid, calendar_id: "primary", event_id: "synthetic_event", etag: '"synthetic-v1"',
      candidate_time_zone: "Asia/Kolkata", feedback_hours: 24, booking_instructions: "Contact the hiring team to change this meeting",
      previous_booking_id: nil, reason: "" }.merge(changes)
  end

  def import_booking(input = attributes)
    post "#{root}/bookings/import", params: { hiring_booking: input }, as: :json
  end

  it "offers manual fallback without querying a provider when disconnected or unconfigured" do
    provider = stub_request(:get, %r{\Ahttps://www\.googleapis\.com/})
    get "#{root}/calendar_events", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("connected" => false, "reason" => "disconnected")
    allow(ENV).to receive(:fetch).with("GOOGLE_CLIENT_ID", "").and_return("")
    get "#{root}/calendar_events", params: { company_id: company.id }
    expect(response.parsed_body).to include("connected" => false, "reason" => "unconfigured")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(provider).not_to have_been_requested
  end

  it "lists bounded calendar and event pages without exposing unrelated meetings or descriptions" do
    connect_calendar
    calendars = stub_request(:get, "https://www.googleapis.com/calendar/v3/users/me/calendarList")
      .with(query: hash_including("maxResults" => "20", "pageToken" => "calendar-page"))
      .to_return(json_reply({ items: [{ id: "primary", summary: "Hiring calendar" }], nextPageToken: "next-calendar" }))
    get "#{root}/calendar_events", params: { company_id: company.id, page_token: "calendar-page" }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("connected" => true, "calendars" => [{ "id" => "primary", "name" => "Hiring calendar" }],
      "next_page_token" => "next-calendar")
    expect(request.filtered_parameters.fetch("page_token")).to eq("[FILTERED]")
    expect(admin.reload.calendar_connected).to be(true)
    unrelated = event.deep_dup.merge("id" => "other", "summary" => "PRIVATE UNRELATED MEETING", "attendees" => [])
    events = stub_request(:get, google_events_url).with(query: hash_including(
      "maxResults" => "20", "singleEvents" => "true", "timeMin" => "2027-01-15T00:00:00Z", "timeMax" => "2027-01-22T00:00:00Z"
    )).to_return(json_reply({ items: [unrelated, event.merge("description" => "PRIVATE PROVIDER DESCRIPTION")], nextPageToken: "next-event" }))
    get "#{root}/calendar_events", params: { company_id: company.id, calendar_id: "primary", from: "2027-01-15" }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("events").pluck("id")).to eq(["synthetic_event"])
    expect(response.parsed_body.fetch("next_page_token")).to eq("next-event")
    expect(request.filtered_parameters.fetch("calendar_id")).to eq("[FILTERED]")
    expect(response.body).not_to include("PRIVATE UNRELATED", "PRIVATE PROVIDER", "attendees", "access_token")
    expect(calendars).to have_been_requested.once
    expect(events).to have_been_requested.once
  end

  it "imports exact UTC microseconds with the candidate zone and encrypted provider identity" do
    connect_calendar
    request = stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply(event))
    import_booking
    expect(response).to have_http_status(:created)
    record = round.hiring_interview_bookings.sole
    expect(record.starts_at).to eq(Time.iso8601("2027-01-15T09:00:15.123456Z"))
    expect(record.ends_at - record.starts_at).to eq(45.minutes)
    expect(record.details).to include("source" => "google_calendar", "candidate_time_zone" => "Asia/Kolkata",
      "starts_local" => "2027-01-15T14:30:15.123456", "utc_offset" => "+05:30")
    expect(response.parsed_body.dig("booking", "starts_at")).to eq("2027-01-15T09:00:15.123456Z")
    expect(record.details.fetch("provider")).to include("calendar_id" => "primary", "event_id" => "synthetic_event", "etag" => '"synthetic-v1"')
    expect(record.read_attribute_before_type_cast("details")).not_to include("synthetic_event", "meet.example.test")
    expect(record.staff_details.to_json).not_to include("synthetic_event", "etag", "provider")
    expect(request).to have_been_requested.once
    expect(HiringMessage.count).to eq(0)
  end

  it "recovers an accepted request before requiring a provider connection and rejects changed intent" do
    connect_calendar
    stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply(event))
    input = attributes
    import_booking(input)
    expect(response).to have_http_status(:created)
    id = response.parsed_body.dig("booking", "id")
    get api_v1_redirect_path
    state = Rack::Utils.parse_query(URI.parse(response.parsed_body.fetch("url")).query).fetch("state")
    get api_v1_callback_path, params: { state:, error: "access_denied" }
    WebMock.reset!
    import_booking(input)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("booking", "id")).to eq(id)
    import_booking(input.merge(feedback_hours: 48))
    expect(response).to have_http_status(:conflict)
    expect(round.hiring_interview_bookings.count).to eq(1)
  end

  it "rejects events without the candidate and full available panel, unsupported clocks and cancelled or repeating masters" do
    connect_calendar
    cases = [event.merge("status" => "cancelled"), event.merge("attendeesOmitted" => true), event.merge("endTimeUnspecified" => true),
      event.merge("recurrence" => ["RRULE:FREQ=DAILY"]), event.merge("start" => { "date" => "2027-01-15" }),
      event.merge("attendees" => event.fetch("attendees").take(1)), event.merge("attendees" => event.fetch("attendees").drop(1)),
      event.merge("attendees" => event.fetch("attendees").map { |attendee| attendee.merge("responseStatus" => "declined") }),
      event.merge("end" => { "dateTime" => "2027-01-15T10:00:15.123456Z" }),
      event.merge("start" => { "dateTime" => "2027-01-15T09:00:15.123456789Z" })]
    cases.each do |invalid|
      stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply(invalid))
      import_booking
      expect(response).to have_http_status(:unprocessable_content)
      expect(round.hiring_interview_bookings).to be_empty
    end
  end

  it "accepts a single recurring instance and an assigned organizer who is not repeated among attendees" do
    connect_calendar
    instance = event.merge("recurringEventId" => "parent_event", "originalStartTime" => event.fetch("start"),
      "organizer" => { "email" => interviewer.email }, "attendees" => event.fetch("attendees").take(1))
    stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply(instance))
    import_booking
    expect(response).to have_http_status(:created)
  end

  it "rejects a changed preview etag and unavailable events without writing a booking" do
    connect_calendar
    stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply(event.merge("etag" => '"changed"')))
    import_booking
    expect(response).to have_http_status(:conflict)
    [404, 410].each do |status|
      stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply({ error: { message: "PRIVATE PROVIDER ERROR" } }, status:))
      import_booking
      expect(response).to have_http_status(:not_found)
      expect(response.body).not_to include("PRIVATE PROVIDER ERROR")
    end
    expect(round.hiring_interview_bookings).to be_empty
  end

  it "reports transient provider failures without storing partial bookings" do
    connect_calendar
    stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply({ error: { message: "PRIVATE PROVIDER ERROR" } }, status: 503))
    import_booking
    expect(response).to have_http_status(:service_unavailable)
    expect(response.body).not_to include("PRIVATE PROVIDER ERROR")
    expect(round.hiring_interview_bookings).to be_empty
  end

  it "treats provider throttling and transport timeouts as retryable failures" do
    connect_calendar
    stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply({ error: { message: "quota" } }, status: 429))
    import_booking
    expect(response).to have_http_status(:service_unavailable)
    stub_request(:get, "#{google_events_url}/synthetic_event").to_timeout
    import_booking
    expect(response).to have_http_status(:service_unavailable)
    expect(round.hiring_interview_bookings).to be_empty
  end

  it "clears revoked provider authorization and leaves manual scheduling available" do
    connect_calendar
    stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply({ error: { message: "revoked" } }, status: 401))
    import_booking
    expect(response).to have_http_status(:unprocessable_content)
    expect(request.session[:authorization]).to be_nil
    get "#{root}/calendar_events", params: { company_id: company.id }
    expect(response.parsed_body).to include("connected" => false, "reason" => "disconnected")
  end

  { "round version" => 409, "candidate email" => 409, "admin role" => 403, "workspace" => 403,
    "panel employment" => 422, "panel grant" => 422 }.each do |change, expected|
    it "rechecks #{change} after provider I/O outside the scheduling locks" do
      connect_calendar
      input = attributes
      fixture = event
      baseline = ActiveRecord::Base.connection.open_transactions
      stub_request(:get, "#{google_events_url}/synthetic_event").to_return do
        expect(ActiveRecord::Base.connection.open_transactions).to eq(baseline)
        case change
        when "round version" then round.touch
        when "candidate email" then application.hiring_candidate.update!(email: Faker::Internet.unique.email)
        when "admin role" then admin.remove_role(:admin, company)
        when "workspace" then admin.update!(current_workspace: create(:company))
        when "panel employment" then staff.update!(resigned_at: Date.yesterday)
        when "panel grant" then round.hiring_access_grants.active.update_all(revoked_at: Time.current)
        end
        json_reply(fixture)
      end
      import_booking(input)
      expect(response.status).to eq(expected)
      expect(round.hiring_interview_bookings).to be_empty
    end
  end

  it "denies staff, wrong workspaces and forged clock fields before querying Google" do
    provider = stub_request(:get, %r{\Ahttps://www\.googleapis\.com/})
    input = attributes
    import_booking(input.merge(starts_at: "2027-01-15T09:00:00Z"))
    expect(response).to have_http_status(:bad_request)
    import_booking(input.merge(company_id: company.id + 1))
    expect(response).to have_http_status(:conflict)
    sign_in interviewer
    import_booking(input)
    expect(response).to have_http_status(:forbidden)
    expect(provider).not_to have_been_requested
  end

  it "requires every member of a multi-person panel rather than one matching interviewer" do
    connect_calendar
    second_user = create(:user, current_workspace: company)
    second_user.add_role(:employee, company)
    employment = create(:employment, company:, user: second_user, resigned_at: nil)
    second_panel = HiringPanelMember.create!(company:, employment:, details: { "expertise" => "Ruby" })
    round
    Hiring::Interviews.new(application:, actor: admin).update!(record: round, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "interview_version" => round.reload.lock_version, "action" => "update", "details" => round.details,
      "panel" => [panel_member, second_panel].map { |member| { "panel_member_id" => member.id, "compensation_access" => false } }
    })
    stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply(event))
    import_booking
    expect(response).to have_http_status(:unprocessable_content)
    full = event.merge("attendees" => event.fetch("attendees") + [{ "email" => second_user.email, "responseStatus" => "accepted" }])
    stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply(full))
    import_booking
    expect(response).to have_http_status(:created)
  end

  it "rechecks permissions before returning an event search response" do
    connect_calendar
    round
    fixture = event
    stub_request(:get, google_events_url).with(query: hash_including("maxResults" => "20")).to_return do
      admin.remove_role(:admin, company)
      json_reply({ items: [fixture] })
    end
    get "#{root}/calendar_events", params: { company_id: company.id, calendar_id: "primary", from: "2027-01-15" }
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include("Synthetic technical interview", "synthetic_event", "etag")
  end

  it "does not turn idempotent recovery into access after the Admin role is revoked" do
    connect_calendar
    input = attributes
    request = stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply(event))
    import_booking(input)
    expect(response).to have_http_status(:created)
    admin.remove_role(:admin, company)
    import_booking(input)
    expect(response).to have_http_status(:forbidden)
    expect(request).to have_been_requested.once
  end

  it "replaces a manual booking only with an explicit reason and rolls back an invalid imported URL" do
    connect_calendar
    round
    original = Hiring::Scheduling.new(interview: round, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "interview_version" => round.reload.lock_version,
      "request_key" => SecureRandom.uuid, "starts_local" => "2027-01-14T14:30", "candidate_time_zone" => "Asia/Kolkata",
      "feedback_hours" => 24, "booking_instructions" => "Contact the hiring team"
    })
    stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply(event))
    import_booking
    expect(response).to have_http_status(:conflict)
    import_booking(attributes(previous_booking_id: original.id))
    expect(response).to have_http_status(:unprocessable_content)
    stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply(event.merge("hangoutLink" => "javascript:alert(1)")))
    import_booking(attributes(previous_booking_id: original.id, reason: "Candidate requested a change"))
    expect(response).to have_http_status(:unprocessable_content)
    expect(original.reload).to have_attributes(status: "scheduled", lock_version: 0)
    stub_request(:get, "#{google_events_url}/synthetic_event").to_return(json_reply(event))
    import_booking(attributes(previous_booking_id: original.id, reason: "Candidate requested a change"))
    expect(response).to have_http_status(:created)
    expect(original.reload.status).to eq("cancelled")
    expect(round.hiring_interview_bookings.count).to eq(2)
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{round.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("handover", "booking", "starts_at")).to eq("2027-01-15T09:00:15.123456Z")
    expect(response.body).not_to include("synthetic_event", "etag", "provider", "Candidate requested a change")
  end
end
