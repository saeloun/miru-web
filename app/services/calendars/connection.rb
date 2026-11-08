# frozen_string_literal: true

module Calendars
  class Connection
    class Disconnected < StandardError; end
    OWNER_SESSION_KEY = :google_calendar_authorization_user_id

    def initialize(session:, user:, redirect_uri:)
      @session, @user, @redirect_uri = session, user, redirect_uri
    end

    def configured?
      ENV.fetch("GOOGLE_CLIENT_ID", "").present? && ENV.fetch("GOOGLE_CLIENT_SECRET", "").present?
    end

    def client
      @client ||= Signet::OAuth2::Client.new(client_id: ENV.fetch("GOOGLE_CLIENT_ID", ""),
        client_secret: ENV.fetch("GOOGLE_CLIENT_SECRET", ""), authorization_uri: "https://accounts.google.com/o/oauth2/auth",
        token_credential_uri: "https://oauth2.googleapis.com/token", scope: Google::Apis::CalendarV3::AUTH_CALENDAR_READONLY,
        redirect_uri: @redirect_uri)
    end

    def authorized_client
      authorization = @session[:authorization]
      unless @session[OWNER_SESSION_KEY] == @user.id && authorization.is_a?(Hash) && authorization["access_token"].present?
        disconnect!
        raise Disconnected
      end

      client.update!(authorization)
      client
    end

    def save!(authorization)
      @session[:authorization] = authorization
      @session[OWNER_SESSION_KEY] = @user.id
    end

    def disconnect!
      @session.delete(:authorization)
      @session.delete(OWNER_SESSION_KEY)
      @user.update!(calendar_connected: false) if @user.calendar_connected?
    end
  end
end
