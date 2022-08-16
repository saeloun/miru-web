# frozen_string_literal: true

module PunditConcern
  extend ActiveSupport::Concern
  include Pundit::Authorization

  included do
    after_action :verify_authorized, unless: :devise_controller?
  end
end
