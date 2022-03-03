# frozen_string_literal: true

class InternalApi::V1::ApplicationController < ActionController::API
  include PunditHelper
  include ActionController::MimeResponds
  include ErrorHandler
  include CurrentCompanyConcern

  before_action :authenticate_user!
  after_action :verify_authorized
end
