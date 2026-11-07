# frozen_string_literal: true

class Api::V1::CalendarsController < Api::V1::ApplicationController
  OAUTH_STATE_SESSION_KEY = :google_calendar_oauth_state
  OAUTH_USER_SESSION_KEY = :google_calendar_oauth_user_id
  AUTHORIZATION_USER_SESSION_KEY = :google_calendar_authorization_user_id

  before_action :set_client

  def redirect
    authorize :redirect, policy_class: CalendarPolicy

    state = SecureRandom.hex(24)
    session[OAUTH_STATE_SESSION_KEY] = state
    session[OAUTH_USER_SESSION_KEY] = current_user.id
    @client.state = state

    render json: { url: @client.authorization_uri.to_s }
  end

  def callback
    authorize :callback, policy_class: CalendarPolicy

    unless valid_oauth_state?
      clear_oauth_state
      redirect_to root_path, alert: "Calendar authorization failed"
      return
    end

    authorization_code = params[:code]

    if authorization_code.present?
      @client.code = authorization_code

      response = @client.fetch_access_token!
      session[:authorization] = response
      session[AUTHORIZATION_USER_SESSION_KEY] = current_user.id
      clear_oauth_state

      redirect_to api_v1_calendars_path
    else
      clear_oauth_state
      clear_calendar_authorization
      redirect_to root_path, alert: "Calendar authorization failed"
    end
  end

  def calendars
    authorize :calendars, policy_class: CalendarPolicy

    return unless load_authorization

    service = Google::Apis::CalendarV3::CalendarService.new
    service.authorization = @client

    @calendar_list = service.list_calendar_lists
    current_user.update!(calendar_connected: true)
    primary_calendar = @calendar_list.items.find { |item| item.summary.include?("@") }
    calendar_id = primary_calendar&.id

    if calendar_id.blank?
      redirect_to root_path, alert: "No suitable calendar found"
      return
    end

    redirect_to api_v1_events_path(calendar_id)
  end

  def events
    authorize :events, policy_class: CalendarPolicy

    return unless load_authorization
    current_month = Time.current.month
    current_year = Time.current.year
    calendar_id = params[:calendar_id]

    meetings = Calendars::MonthlyCalendarEventsService.new(
      calendar_id, current_month, current_year, @client
    ).get_events_for_month

    render :events, locals: { meetings: }
  end

  private

    def client_options
      {
        client_id: ENV.fetch("GOOGLE_CLIENT_ID", ""),
        client_secret: ENV.fetch("GOOGLE_CLIENT_SECRET", ""),
        authorization_uri: "https://accounts.google.com/o/oauth2/auth",
        token_credential_uri: "https://oauth2.googleapis.com/token",
        scope: Google::Apis::CalendarV3::AUTH_CALENDAR_READONLY,
        redirect_uri: api_v1_callback_url
      }
    end

    def set_client
      response.headers["Cache-Control"] = "private, no-store"
      @client = Signet::OAuth2::Client.new(client_options)
    end

    def load_authorization
      authorization = session[:authorization]
      if session[AUTHORIZATION_USER_SESSION_KEY] == current_user.id && authorization.is_a?(Hash) && authorization["access_token"].present?
        @client.update!(authorization)
        return true
      end

      clear_calendar_authorization
      redirect_to root_path, alert: "Connect your Google Calendar before reading meetings"
      false
    end

    def clear_calendar_authorization
      session.delete(:authorization)
      session.delete(AUTHORIZATION_USER_SESSION_KEY)
      current_user.update!(calendar_connected: false) if current_user.calendar_connected?
    end

    def valid_oauth_state?
      params[:state].present? &&
        params[:state] == session[OAUTH_STATE_SESSION_KEY] &&
        session[OAUTH_USER_SESSION_KEY].to_i == current_user.id
    end

    def clear_oauth_state
      session.delete(OAUTH_STATE_SESSION_KEY)
      session.delete(OAUTH_USER_SESSION_KEY)
    end
end
