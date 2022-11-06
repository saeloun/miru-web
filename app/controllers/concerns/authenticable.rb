# frozen_string_literal: true

module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user_using_auth_token
  end

  private

    def authenticate_user_using_auth_token
      if bearer_token == user.token || params[:auth_token] == user.token
        api_v1_timesheet_entry_index_path
      else
        render json: { notice: "Invalid Token given UserID" }
      end
    end

    def user
      @_user ||= User.find_by(id: params[:user_id])
    end

    def bearer_token
      pattern = /^Bearer /
      header = request.headers["Authorization"]
      header.gsub(pattern, "") if header && header.match(pattern)
    end
end
