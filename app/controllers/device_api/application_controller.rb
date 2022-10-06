# frozen_string_literal: true

class DeviceApi::ApplicationController < ActionController::API
  include PunditConcern
  include ActionController::MimeResponds
  include ErrorHandler
  include CurrentCompanyConcern
  include Pagy::Backend
  include DeviceApiTokenAuthenticator
end
