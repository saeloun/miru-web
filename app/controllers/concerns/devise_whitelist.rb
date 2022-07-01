# frozen_string_literal: true

module DeviseWhitelist
  extend ActiveSupport::Concern

  included do
    before_action :configured_permitted_parameters, if: :devise_controller?
  end

  def configured_permitted_parameters
    devise_parameter_sanitizer.permit(
      :invite,
      keys: [:first_name, :last_name, :current_workspace_id, :department_id, :avatar])
    devise_parameter_sanitizer.permit(
      :sign_up,
      keys: [:first_name, :last_name, :email, :password, :password_confirmation, :avatar])
    devise_parameter_sanitizer.permit(
      :account_update,
      keys: [:first_name, :last_name, :email, :password, :password_confirmation, :avatar])
  end
end
