# frozen_string_literal: true

module PunditHelper
  extend ActiveSupport::Concern
  include Pundit::Authorization

  included do
    after_action :verify_authorized, unless: :devise_controller?
  end

  def devise_controller?
    super
  end
end
