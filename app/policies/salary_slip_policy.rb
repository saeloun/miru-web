# frozen_string_literal: true

class SalarySlipPolicy < ApplicationPolicy
  STAFF_ROLES = %i[owner admin manager employee book_keeper].freeze

  def index?
    active_member? && roles.where(name: STAFF_ROLES).exists?
  end

  def create?
    index? && roles.where(name: %w[owner admin]).exists?
  end
  alias_method :publish?, :create?
  alias_method :withdraw?, :create?
  alias_method :email?, :create?

  def roles
    user.roles.where(resource_type: "Company", resource_id: user.current_workspace_id)
  end

  def download?
    return false unless index? && record.employment.company_id == user.current_workspace_id

    create? || (record.employment.user_id == user.id && record.status == "published")
  end

  private

    def active_member?
      user.present? && user.current_workspace_id.present? && User.kept.exists?(id: user.id) &&
        Employment.kept.where(user_id: user.id, company_id: user.current_workspace_id)
          .where("joined_at IS NULL OR joined_at <= ?", Date.current)
          .where("resigned_at IS NULL OR resigned_at >= ?", Date.current).exists?
    end
end
