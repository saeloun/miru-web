# frozen_string_literal: true

module CurrentCompany
  extend ActiveSupport::Concern

  def current_company
    @_current_company ||= current_user&.current_workspace || current_user.companies.first

    # TODO: Once switch workspace feature is added the logic to set Current workspace for user will be moved to
    # - Company#create action
    # - Controller action that will Switch a users' workspace
    if current_user.current_workspace_id? && @_current_company && current_user.current_workspace_id != @_current_company.id
      current_user.update(current_workspace_id: @_current_company.id)
    end

    @_current_company
  end
end
