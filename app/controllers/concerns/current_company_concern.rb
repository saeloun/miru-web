# frozen_string_literal: true

module CurrentCompanyConcern
  extend ActiveSupport::Concern

  included do
    helper_method :current_company
  end

  def current_company
    return unless current_user.present?

    @_current_company ||= current_user&.current_workspace || current_user.companies.includes(:logo_attachment).first
  end
end
