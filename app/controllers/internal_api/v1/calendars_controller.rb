# frozen_string_literal: true

class InternalApi::V1::CalendarsController < ApplicationController
  def redirect
    authorize :redirect, policy_class: CalendarPolicy

    client = Signet::OAuth2::Client.new(client_options)

    redirect_to client.authorization_uri.to_s, allow_other_host: true
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
      redirect_to root_path
    end
  end

  def calendars
    authorize :calendars, policy_class: CalendarPolicy

    client = Signet::OAuth2::Client.new(client_options)
    client.update!(session[:authorization])

    service = Google::Apis::CalendarV3::CalendarService.new
    service.authorization = client

    @calendar_list = service.list_calendar_lists
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
end
