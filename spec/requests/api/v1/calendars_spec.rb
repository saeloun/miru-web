# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Calendars", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
    sign_in user
  end

  it "issues and validates OAuth state" do
    allow_any_instance_of(Signet::OAuth2::Client)
      .to receive(:fetch_access_token!)
      .and_return("access_token" => "token")

    get "/api/v1/calendars/redirect", headers: auth_headers(user)
    state = Rack::Utils.parse_query(URI.parse(json_response["url"]).query)["state"]

    expect(state).to be_present

    get "/api/v1/calendars/callback",
      params: { code: "authorization-code", state: },
      headers: auth_headers(user)

    expect(response).to redirect_to(api_v1_calendars_path)
  end

  it "rejects a callback with invalid state before token exchange" do
    expect_any_instance_of(Signet::OAuth2::Client).not_to receive(:fetch_access_token!)

    get "/api/v1/calendars/redirect", headers: auth_headers(user)
    get "/api/v1/calendars/callback",
      params: { code: "authorization-code", state: "wrong-state" },
      headers: auth_headers(user)

    expect(response).to redirect_to(root_path)
  end

  def connect_calendar
    stub_request(:post, "https://oauth2.googleapis.com/token").to_return(
      status: 200, headers: { "Content-Type" => "application/json" },
      body: { access_token: "synthetic-calendar-token", token_type: "Bearer", expires_in: 3600 }.to_json
    )
    get api_v1_redirect_path
    state = Rack::Utils.parse_query(URI.parse(response.parsed_body.fetch("url")).query).fetch("state")
    get api_v1_callback_path, params: { code: "synthetic-code", state: }
    expect(response).to redirect_to(api_v1_calendars_path)
  end

  it "binds the real SDK token exchange to its Miru user and uses read-only scope" do
    connect_calendar
    expect(request.session[:google_calendar_authorization_user_id]).to eq(user.id)
    expect(request.session[:authorization]).to include("access_token" => "synthetic-calendar-token")
    get api_v1_redirect_path
    query = Rack::Utils.parse_query(URI.parse(response.parsed_body.fetch("url")).query)
    expect(query.fetch("scope")).to eq(Google::Apis::CalendarV3::AUTH_CALENDAR_READONLY)
  end

  it "allows the owner to read calendars and events through the real Google SDK" do
    connect_calendar
    calendar_request = stub_request(:get, "https://www.googleapis.com/calendar/v3/users/me/calendarList")
      .with(headers: { "Authorization" => "Bearer synthetic-calendar-token" }).to_return(
        status: 200, headers: { "Content-Type" => "application/json" },
        body: { items: [{ id: "synthetic@example.test", summary: "synthetic@example.test" }] }.to_json
      )
    get api_v1_calendars_path
    expect(response).to redirect_to(api_v1_events_path("synthetic@example.test"))
    event_request = stub_request(:get, %r{\Ahttps://www\.googleapis\.com/calendar/v3/calendars/synthetic(?:@|%40)example\.test/events(?:\?[^#]*)?\z})
      .with(headers: { "Authorization" => "Bearer synthetic-calendar-token" }).to_return(
        status: 200, headers: { "Content-Type" => "application/json" }, body: { items: [] }.to_json
      )
    get api_v1_events_path("synthetic@example.test")
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq([])
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(calendar_request).to have_been_requested.once
    expect(event_request).to have_been_requested.once
  end

  it "clears a different signed-in user's calendar authorization before any provider read" do
    connect_calendar
    other = create(:user, current_workspace: company, calendar_connected: true)
    create(:employment, company:, user: other)
    other.add_role(:employee, company)
    sign_in other
    calendar_request = stub_request(:get, %r{\Ahttps://www\.googleapis\.com/}).to_return(
      status: 200, headers: { "Content-Type" => "application/json" }, body: { items: [] }.to_json
    )
    get api_v1_calendars_path
    expect(response).to redirect_to(root_path)
    expect(other.reload.calendar_connected).to be(false)
    expect(request.session[:authorization]).to be_nil
    expect(request.session[:google_calendar_authorization_user_id]).to be_nil
    get api_v1_events_path("synthetic@example.test")
    expect(response).to redirect_to(root_path)
    expect(calendar_request).not_to have_been_requested
  end

  it "requires a connection before listing calendars or reading a supplied event calendar" do
    provider_request = stub_request(:get, %r{\Ahttps://www\.googleapis\.com/}).to_return(
      status: 200, headers: { "Content-Type" => "application/json" }, body: { items: [] }.to_json
    )
    get api_v1_calendars_path
    expect(response).to redirect_to(root_path)
    get api_v1_events_path("synthetic@example.test")
    expect(response).to redirect_to(root_path)
    expect(provider_request).not_to have_been_requested
  end

  it "denies a direct events request after switching users without first visiting the calendar list" do
    connect_calendar
    other = create(:user, current_workspace: company)
    create(:employment, company:, user: other)
    other.add_role(:employee, company)
    sign_in other
    provider_request = stub_request(:get, %r{\Ahttps://www\.googleapis\.com/})
    get api_v1_events_path("synthetic@example.test")
    expect(response).to redirect_to(root_path)
    expect(request.session[:authorization]).to be_nil
    expect(provider_request).not_to have_been_requested
  end

  it "requires an owner binding for a legacy authorization, even when the profile says connected" do
    user.update!(calendar_connected: true)
    legacy_session = { authorization: { "access_token" => "synthetic-legacy-token" } }
    allow_any_instance_of(Api::V1::CalendarsController).to receive(:session).and_return(legacy_session)
    provider_request = stub_request(:get, %r{\Ahttps://www\.googleapis\.com/})
    get api_v1_events_path("synthetic@example.test")
    expect(response).to redirect_to(root_path)
    expect(legacy_session).not_to have_key(:authorization)
    expect(user.reload.calendar_connected).to be(false)
    expect(provider_request).not_to have_been_requested
  end

  it "clears an earlier connection when its owner declines a new authorization" do
    connect_calendar
    get api_v1_redirect_path
    state = Rack::Utils.parse_query(URI.parse(response.parsed_body.fetch("url")).query).fetch("state")
    get api_v1_callback_path, params: { error: "access_denied", state: }
    expect(response).to redirect_to(root_path)
    expect(request.session[:authorization]).to be_nil
    expect(request.session[:google_calendar_authorization_user_id]).to be_nil
    expect(user.reload.calendar_connected).to be(false)
  end

  it "returns to the application after a state-bound hiring connection and clears the return path" do
    allow_any_instance_of(Signet::OAuth2::Client).to receive(:fetch_access_token!).and_return("access_token" => "synthetic-token")
    get api_v1_redirect_path, params: { return_to: "/hiring/applications/123" }
    state = Rack::Utils.parse_query(URI.parse(response.parsed_body.fetch("url")).query).fetch("state")
    get api_v1_callback_path, params: { code: "synthetic-code", state: }
    expect(response).to redirect_to("/hiring/applications/123")
    expect(request.session[:google_calendar_return_to]).to be_nil
    get api_v1_redirect_path
    state = Rack::Utils.parse_query(URI.parse(response.parsed_body.fetch("url")).query).fetch("state")
    get api_v1_callback_path, params: { code: "synthetic-code", state: }
    expect(response).to redirect_to(api_v1_calendars_path)
  end

  it "rejects external, malformed and callback-supplied return paths" do
    allow_any_instance_of(Signet::OAuth2::Client).to receive(:fetch_access_token!).and_return("access_token" => "synthetic-token")
    ["https://example.test", "//example.test", "/hiring/applications/123?return_to=//example.test", { unsafe: true }].each do |path|
      get api_v1_redirect_path, params: { return_to: path }
      state = Rack::Utils.parse_query(URI.parse(response.parsed_body.fetch("url")).query).fetch("state")
      get api_v1_callback_path, params: { code: "synthetic-code", state:, return_to: "https://example.test" }
      expect(response).to redirect_to(api_v1_calendars_path)
    end
  end
end
