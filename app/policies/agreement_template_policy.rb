# frozen_string_literal: true

class AgreementTemplatePolicy < ApplicationPolicy
  def index?
    company_id = user.current_workspace_id
    user.kept? && user.employments.kept.where(company_id:)
      .where("joined_at IS NULL OR joined_at <= ?", Date.current)
      .where("resigned_at IS NULL OR resigned_at >= ?", Date.current).exists? &&
      Role.joins(:users).where(users: { id: user.id }, resource_type: "Company", resource_id: company_id,
        name: %w[owner admin]).exists?
  end
  alias_method :create?, :index?
  alias_method :import?, :index?

  def show?
    index? && record.company_id == user.current_workspace_id
  end
  alias_method :update?, :show?
  alias_method :download?, :show?
end
