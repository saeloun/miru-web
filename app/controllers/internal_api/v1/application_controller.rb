# frozen_string_literal: true

class InternalApi::V1::ApplicationController < ActionController::API
  before_action :authenticate_user!
end
