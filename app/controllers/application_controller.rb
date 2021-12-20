# frozen_string_literal: true

class ApplicationController < ActionController::Base
  before_action :authenticate_request
  attr_reader :current_user

  private
    def authenticate_request
      @current_user = Authentication::AuthorizeApiRequest.process(request.headers).result
      render json: { error: "Not Authorized" }, status: 401 unless @current_user
    end
end
