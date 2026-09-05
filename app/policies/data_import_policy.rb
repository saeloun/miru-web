# frozen_string_literal: true

class DataImportPolicy < ApplicationPolicy
  class Scope
    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      scope.where(company_id: user.current_workspace_id)
    end

    private

      attr_reader :user, :scope
  end

  def create?
    user_owner_role? || user_admin_role?
  end

  def show?
    record.company_id == user.current_workspace_id && create?
  end
end
