# frozen_string_literal: true

class AuditLogPolicy < ApplicationPolicy
  def index?
    has_owner_or_admin_role? && pro_access?
  end

  private

    def pro_access?
      user.current_workspace&.pro_access?
    end
end
