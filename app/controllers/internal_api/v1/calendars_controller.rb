# frozen_string_literal: true

class InternalApi::V1::CalendarsController < ApplicationController
  before_action :set_client

  def redirect
    authorize :redirect, policy_class: CalendarPolicy

    render json: { url: @client.authorization_uri.to_s }
  end

  def callback
    authorize :callback, policy_class: CalendarPolicy

    authorization_code = params[:code]

    if authorization_code.present?
      @client.code = authorization_code

      response = @client.fetch_access_token!
      session[:authorization] = response

      redirect_to internal_api_v1_calendars_path
    else
      current_user.update!(calendar_connected: false)
    end
  end

  def calendars
    authorize :calendars, policy_class: CalendarPolicy

    @client.update!(session[:authorization])
    current_user.update!(calendar_connected: true)

    service = Google::Apis::CalendarV3::CalendarService.new
    service.authorization = @client

    @calendar_list = service.list_calendar_lists
    calendar_id = @calendar_list.items.select(&:primary?).first.id
    current_user.update!(calendar_id:)

    redirect_to "/settings/integrations"
  end

  def events
    authorize :events, policy_class: CalendarPolicy

    @client.update!(session[:authorization])
    current_month = params[:month]
    current_year = params[:year]
    calendar_id = current_user.calendar_id

    # Making use of instance variable here just because otherwise it wouldn't be accessible for the test case
    @meetings = Calendars::MonthlyCalendarEventsService.new(
      calendar_id, current_month, current_year, @client
    ).get_events_for_month

    render :events, locals: { meetings: @meetings }
  rescue Google::Apis::AuthorizationError
    response = @client.refresh!

    session[:authorization] = session[:authorization].merge(response)

    retry
  end

  private

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

    def set_client
      @client = Signet::OAuth2::Client.new(client_options)
    end
end
