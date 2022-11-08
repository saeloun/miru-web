# frozen_string_literal: true

module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_token
  end

  def authenticate_token
    return render json: { status: 403, notice: "Invalid Token." } if current_user.blank?
  end

  private

    def current_user
      @current_user ||= User.find_by(token:)
    end

    def bearer_token
      pattern = /^Bearer /
      header = request.headers["Authorization"]
      header.gsub(pattern, "") if header && header.match(pattern)
    end

    def token
      if bearer_token.present?
        @_token = bearer_token
      elsif params[:auth_token].present?
        @_token = params[:auth_token]
      end
    end
end
