# frozen_string_literal: true

class InternalApi::V1::ApplicationController < ActionController::API
  include ActionController::MimeResponds
  include ErrorHandler
  include CurrentCompany

  before_action :authenticate_user!
  helper_method :current_company
end
