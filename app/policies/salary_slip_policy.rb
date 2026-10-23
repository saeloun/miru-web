# frozen_string_literal: true

class SalarySlipPolicy < ApplicationPolicy
  STAFF_ROLES = %i[owner admin manager employee book_keeper].freeze

  def index?
    active_member? && STAFF_ROLES.any? { |role| user.has_cached_role?(role, user.current_workspace) }
  end

  def create?
    index? && has_owner_or_admin_role?
  end
  alias_method :publish?, :create?
  alias_method :withdraw?, :create?

  def download?
    return false unless index? && record.employment.company_id == user.current_workspace_id

    create? || (record.employment.user_id == user.id && record.status == "published")
  end

  private

    def active_member?
      user.present? && PayrollRunPolicy.new(user, PayrollRun).active_member?
    end
end
