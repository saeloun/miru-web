# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include DeviseWhitelist
  include PunditConcern
  include ErrorHandler
  include CurrentCompanyConcern
  include Pagy::Backend
  include SetCurrentDetails

  # Vite handles asset compilation

  before_action :authenticate_user!
end
