# frozen_string_literal: true

module SameOriginAuthentication
  private

    def reject_cross_origin_authentication!
      source = request.headers["Origin"].presence || request.referer
      return if source.blank?

      source_uri = URI.parse(source)
      return if source_uri.is_a?(URI::HTTP) && source_uri.origin == request.base_url

      render json: { error: "Cross-origin authentication is not allowed" }, status: 403
    rescue URI::InvalidURIError
      render json: { error: "Cross-origin authentication is not allowed" }, status: 403
    end
end
