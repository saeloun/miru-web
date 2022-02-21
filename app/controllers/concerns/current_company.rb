# frozen_string_literal: true

module CurrentCompany
  extend ActiveSupport::Concern

  def current_company
    @_current_company ||= current_user&.current_workspace || current_user.companies.first

    if current_user.current_workspace_id.nil? && @_current_company.present?
      current_user.update(current_workspace_id: @_current_company.id)
    end

    @_current_company
  end
end
