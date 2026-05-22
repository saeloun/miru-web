# frozen_string_literal: true

class TaxConfigurationPolicy < ApplicationPolicy
  def index?
    has_owner_or_admin_role?
  end

  def create?
    has_owner_or_admin_role?
  end

  def update?
    has_owner_or_admin_role? && same_workspace?
  end

  def destroy?
    update?
  end

  private

    def same_workspace?
      record.respond_to?(:company_id) && record.company_id == user.current_workspace_id
    end
end
