# frozen_string_literal: true

class Api::V1::CalendarsController < Api::V1::ApplicationController
  OAUTH_STATE_SESSION_KEY = :google_calendar_oauth_state
  OAUTH_USER_SESSION_KEY = :google_calendar_oauth_user_id
  OAUTH_RETURN_SESSION_KEY = :google_calendar_return_to

  before_action :set_client

  def redirect
    authorize :redirect, policy_class: CalendarPolicy

    state = SecureRandom.hex(24)
    session[OAUTH_STATE_SESSION_KEY] = state
    session[OAUTH_USER_SESSION_KEY] = current_user.id
    target = params[:return_to]
    session[OAUTH_RETURN_SESSION_KEY] = target.is_a?(String) && target.valid_encoding? && target.match?(%r{\A/hiring/applications/[1-9]\d{0,18}\z}) ? target : nil
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
      calendar_connection.save!(response)
      destination = session[OAUTH_RETURN_SESSION_KEY]
      clear_oauth_state

      redirect_to destination.presence || api_v1_calendars_path
    else
      clear_oauth_state
      calendar_connection.disconnect!
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

    def calendar_connection
      @calendar_connection ||= Calendars::Connection.new(session:, user: current_user, redirect_uri: api_v1_callback_url)
    end

    def set_client
      response.headers["Cache-Control"] = "private, no-store"
      @client = calendar_connection.client
    end

    def load_authorization
      @client = calendar_connection.authorized_client
      true
    rescue Calendars::Connection::Disconnected
      redirect_to root_path, alert: "Connect your Google Calendar before reading meetings"
      false
    end

    def valid_oauth_state?
      params[:state].present? &&
        params[:state] == session[OAUTH_STATE_SESSION_KEY] &&
        session[OAUTH_USER_SESSION_KEY].to_i == current_user.id
    end

    def clear_oauth_state
      session.delete(OAUTH_STATE_SESSION_KEY)
      session.delete(OAUTH_USER_SESSION_KEY)
      session.delete(OAUTH_RETURN_SESSION_KEY)
    end
end
