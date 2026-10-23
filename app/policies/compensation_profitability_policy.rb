# frozen_string_literal: true

class CompensationProfitabilityPolicy < ApplicationPolicy
  def show?
    user.super_admin? && record.present? && user.current_workspace_id == record.id
  end

  alias_method :configure?, :show?
  alias_method :download?, :show?
end
