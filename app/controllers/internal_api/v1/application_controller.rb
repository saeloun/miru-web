# frozen_string_literal: true

class InternalApi::V1::ApplicationController < ActionController::Base
  before_action :authenticate_user!
end
