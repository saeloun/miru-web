# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include DeviseWhitelist
  include PunditConcern
  include ErrorHandler
  include CurrentCompanyConcern
  include Pagy::Backend
  include SetCurrentDetails

  # Include Shakapacker helpers for React components
  helper Shakapacker::Helper

  before_action :authenticate_user!
end
