# frozen_string_literal: true

class InternalApi::V1::ApplicationController < ActionController::API
  include PunditConcern
  include ActionController::MimeResponds
  include ErrorHandler
  include Authenticable
  include CurrentCompanyConcern
  include Pagy::Backend
  include SetCurrentDetails

  helper ApplicationHelper

  before_action :authenticate_user!
end
