# frozen_string_literal: true

class TotpPolicy < ApplicationPolicy
  def show?
    user.present?
  end

  def setup?
    user.present?
  end

  def confirm?
    user.present?
  end

  def destroy?
    user.present?
  end

  def regenerate_recovery_codes?
    user.present?
  end

  def authenticate?
    true
  end
end
