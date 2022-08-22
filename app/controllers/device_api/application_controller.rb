# frozen_string_literal: true

class DeviceApi::ApplicationController < ActionController::API
  include PunditHelper
  include ActionController::MimeResponds
  include ErrorHandler
  include CurrentCompanyConcern
  include Pagy::Backend
end
