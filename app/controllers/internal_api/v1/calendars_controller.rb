# frozen_string_literal: true

class InternalApi::V1::CalendarsController < ApplicationController
  def redirect
    authorize :redirect, policy_class: CalendarPolicy

    client = Signet::OAuth2::Client.new(client_options)

    render json: { url: client.authorization_uri.to_s }
  end

  def callback
    authorize :callback, policy_class: CalendarPolicy

    authorization_code = params[:code]

    if authorization_code.present?
      client = Signet::OAuth2::Client.new(client_options)
      client.code = authorization_code

      response = client.fetch_access_token!
      session[:authorization] = response

      redirect_to internal_api_v1_calendars_path
    else
      current_user.update!(calendar_connected: false)
    end
  end

  def calendars
    authorize :calendars, policy_class: CalendarPolicy

    client = Signet::OAuth2::Client.new(client_options)
    client.update!(session[:authorization])
    current_user.update!(calendar_connected: true)

    service = Google::Apis::CalendarV3::CalendarService.new
    service.authorization = client

    @calendar_list = service.list_calendar_lists
    calendar_id = @calendar_list.items.select { |item| item.summary.include?("@") }.first.id

    redirect_to internal_api_v1_events_path(calendar_id)
  end

  def events
    authorize :events, policy_class: CalendarPolicy

    client = Signet::OAuth2::Client.new(client_options)
    client.update!(session[:authorization])
    current_month = Time.now.month
    current_year = Time.now.year
    calendar_id = params[:calendar_id]

    meetings = get_events_for_month(calendar_id, current_month, current_year, client)

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
        redirect_uri: "#{ENV.fetch("APP_BASE_URL", "")}/internal_api/v1/calendars/callback"
      }
    end

    def get_events_for_month(calendar_id, month, year, client)
      service = Google::Apis::CalendarV3::CalendarService.new
      service.authorization = client
      start_time = DateTime.new(year, month, 1, 0, 0, 0, "+00:00")
      end_time = DateTime.new(year, month, -1, 23, 59, 59, "+00:00")
      meetings = []
      page_token = nil

      begin
        @event_list = service.list_events(
          calendar_id,
          page_token:,
          time_min: start_time.rfc3339,
          time_max: end_time.rfc3339,
          single_events: true
        )
        all_events = @event_list.items.select do |item|
          next unless item.start.date_time.present? || item.end.date_time.present?

          item_start_time = item.start.date_time
          item_end_time = item.end.date_time

          (item_start_time >= start_time && item_end_time <= end_time)
        end

        meetings.concat(all_events)

        if @event_list.next_page_token != page_token
          page_token = @event_list.next_page_token
        else
          page_token = nil
        end
      end while !page_token.nil?

      meetings
    end
end
