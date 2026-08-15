# frozen_string_literal: true

class SsoSettingPolicy < ApplicationPolicy
  def show?
    update?
  end

  def update?
    has_owner_or_admin_role? && record.pro_access?
  end
end
