# frozen_string_literal: true

class InternalApi::V1::ApplicationController < ActionController::API
  include PunditHelper
  include ActionController::MimeResponds
  include ErrorHandler
  include CurrentCompanyConcern
  include Pagy::Backend

  before_action :authenticate_user!
end
