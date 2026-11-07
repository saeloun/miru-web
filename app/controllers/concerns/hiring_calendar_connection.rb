# frozen_string_literal: true

module HiringCalendarConnection
  extend ActiveSupport::Concern

  included do
    rescue_from Calendars::Connection::Disconnected do
      hiring_calendar_connection.disconnect!
      render json: { errors: "Reconnect Google Calendar or record the booking manually." }, status: 422
    end
    rescue_from Hiring::CalendarEvents::Unavailable do
      render json: { errors: "Google Calendar is temporarily unavailable. Retry or record the booking manually." }, status: 503
    end
  end

  private

    def hiring_calendar_connection
      @hiring_calendar_connection ||= Calendars::Connection.new(session:, user: current_user, redirect_uri: api_v1_callback_url)
    end

    def hiring_calendar_events(context)
      raise Calendars::Connection::Disconnected unless hiring_calendar_connection.configured?

      Hiring::CalendarEvents.new(client: hiring_calendar_connection.authorized_client, context:)
    end
end
