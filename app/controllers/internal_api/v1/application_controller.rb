# frozen_string_literal: true

class InternalApi::V1::ApplicationController < ActionController::API
  attr_reader :current_company
  before_action :authenticate_user!, :validate_company!

  private
    def validate_company!
      return if current_user.nil?
      @current_company = current_user.company
    end
end
