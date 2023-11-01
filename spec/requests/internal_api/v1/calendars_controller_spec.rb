# frozen_string_literal: true

require "rails_helper"

RSpec.describe InternalApi::V1::CalendarsController, type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, calendar_id: "primary") }
  let(:client) { Signet::OAuth2::Client.new(client_options) }

  before do
    create(:employment, company:, user:)
    user.add_role :owner, company
    sign_in user
  end

  describe "#redirect" do
    it "redirects to Google authorization page" do
      get internal_api_v1_redirect_path

      expect(response).to be_successful
      expect(JSON.parse(response.body)["url"]).to eq(
        "https://accounts.google.com/o/oauth2/auth?access_type=offline&client_id=#{client_options[:client_id]}&redirect_uri=#{client_options[:redirect_uri]}&response_type=code&scope=#{client_options[:scope]}")
    end
  end

  describe "#callback" do
    it "handles a valid authorization code" do
      allow_any_instance_of(Signet::OAuth2::Client).to receive(:fetch_access_token!).and_return(SecureRandom.hex(64))

      get internal_api_v1_callback_path, params: { code: SecureRandom.hex(73) }
      expect(response).to redirect_to(internal_api_v1_calendars_path)
      expect(session[:authorization]).not_to be_nil
      expect(user.reload.calendar_connected).to be_truthy
    end

    it "handles an empty authorization code" do
      allow_any_instance_of(Signet::OAuth2::Client).to receive(:fetch_access_token!).and_return(SecureRandom.hex(64))

      get internal_api_v1_callback_path, params: { code: "" }
      expect(response).to have_http_status(:success)
      expect(user.reload.calendar_connected).to be_falsey
    end
  end

  describe "#calendars" do
    it "fetches calendars and updates user information" do
      allow_any_instance_of(Signet::OAuth2::Client).to receive(:fetch_access_token!).and_return(SecureRandom.hex(64))
      allow_any_instance_of(Google::Apis::CalendarV3::CalendarService).to receive(:list_calendar_lists).and_return(
        double(
          items: [double(
            primary?: true, id: "primary")]))

      get internal_api_v1_calendars_path
      expect(response).to redirect_to("/settings/integrations")
      expect(user.reload.calendar_connected).to be_truthy
      expect(user.reload.calendar_id).to eq("primary")
    end
  end

  describe "#events" do
    it "gets events for the current month" do
      allow_any_instance_of(Signet::OAuth2::Client).to receive(:fetch_access_token!).and_return(SecureRandom.hex(64))
      allow_any_instance_of(
        Calendars::MonthlyCalendarEventsService
      ).to receive(:get_events_for_month).and_return(event_list)

      get internal_api_v1_events_path, params: { month: "10", year: "2023" }

      expect(response).to have_http_status(:success)
      expect(response).to render_template(:events)
      expect(assigns(:meetings).size).to eq(event_list.size)
    end
  end

  def client_options
    {
      client_id: ENV.fetch("GOOGLE_CLIENT_ID", ""),
      client_secret: ENV.fetch("GOOGLE_CLIENT_SECRET", ""),
      authorization_uri: "https://accounts.google.com/o/oauth2/auth",
      token_credential_uri: "https://oauth2.googleapis.com/token",
      scope: Google::Apis::CalendarV3::AUTH_CALENDAR_READONLY,
      redirect_uri: internal_api_v1_callback_url
    }
  end

  def event_list
    events = [
        OpenStruct.new(
          summary: "Meeting with Client A", start: OpenStruct.new(date_time: DateTime.new(2023, 10, 15, 10, 0)),
          end: OpenStruct.new(date_time: DateTime.new(2023, 10, 15, 11, 0)), description: "meeting about launch"
        ),
        OpenStruct.new(
          summary: "Team Standup", start: OpenStruct.new(date_time: DateTime.new(2023, 10, 16, 9, 0)),
          end: OpenStruct.new(date_time: DateTime.new(2023, 10, 16, 9, 30)), description: "discuss about work done during day time"
        ),
        OpenStruct.new(
          summary: "Meeting with Client B", start: OpenStruct.new(date_time: DateTime.new(2023, 10, 17, 12, 30)),
          end: OpenStruct.new(date_time: DateTime.new(2023, 10, 17, 13, 30)), description: "Meeting about urgent production bug"
        )
      ]
  end
end
