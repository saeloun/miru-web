# frozen_string_literal: true

require "rails_helper"

RSpec.describe InternalApi::V1::CalendarsController, type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, calendar_id: "primary") }
  let(:client) { Signet::OAuth2::Client.new(client_options) }
  let(:access_token) do
    allow(Signet::OAuth2::Client).to receive(:new).and_return(client)
    allow(client).to receive(:fetch_access_token!).and_return("access_token")

    get internal_api_v1_callback_path, params: { code: "1234567890" }

    session[:authorization]
  end

  before do
    create(:employment, company:, user:)
    user.add_role :owner, company
    sign_in user
    access_token
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
    it "fetches access token from Google Calendar" do
      # request.headers["Authorization"] = "Bearer #{access_token}"
      expect(client).to have_received(:fetch_access_token!)
      expect(session[:authorization]).to eq("access_token")
    end

    it "redirects to the calendars page if authorization code is present" do
      # request.headers["Authorization"] = "Bearer #{access_token}"
      # get internal_api_v1_callback_path, params: { code: "1234567890" }
      expect(response).to redirect_to(internal_api_v1_calendars_path)
    end
  end

  describe "#calendars" do
    it "updates user calendar connected status to true when redirected to the calendars method" do
      expect(user.calendar_connected).to eq(true)
    end

    it "redirects to the integrations page" do
      update_client!(access_token)
      get internal_api_v1_calendars_path

      expect(response).to redirect_to("/settings/integrations")
    end
  end

  describe "#events" do
    it "gets events for the current month" do
      get internal_api_v1_events_path, params: { month: "10", year: "2023" }
      current_month = Time.now.month
      current_year = Time.now.year

      service = Calendars::MonthlyCalendarEventsService.new(
        user.calendar_id, current_month, current_year,
        client).get_events_for_month

      expect(service).to have_received(:get_events_for_month).with("10", "2023")
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

  def update_client!(access_token)
    client.update!("access_token" => { key: "access_token", value: access_token })
  end
end
