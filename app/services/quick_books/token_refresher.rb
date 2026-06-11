# frozen_string_literal: true

module QuickBooks
  class TokenRefresher
    def initialize(connection:, oauth_client: OauthClient.new)
      @connection = connection
      @oauth_client = oauth_client
    end

    def refresh!
      connection.with_lock do
        return connection unless connection.access_token_expired?
        raise Error, "QuickBooks refresh token is missing" if connection.refresh_token.blank?

        token_response = oauth_client.refresh!(connection.refresh_token)
        apply_token_response!(token_response)
      rescue Error
        connection.update!(status: :refresh_failed)
        raise
      end
    end

    private

      attr_reader :connection, :oauth_client

      def apply_token_response!(token_response)
        connection.update!(
          status: :connected,
          access_token: token_response.fetch("access_token"),
          refresh_token: token_response["refresh_token"].presence || connection.refresh_token,
          access_token_expires_at: expires_at(token_response["expires_in"]),
          refresh_token_expires_at: expires_at(token_response["x_refresh_token_expires_in"]),
          last_refresh_at: Time.current
        )
        connection
      end

      def expires_at(seconds)
        return nil if seconds.blank?
        seconds.to_i.seconds.from_now
      end
  end
end
