# frozen_string_literal: true

class PasskeyPolicy < ApplicationPolicy
  def index?
    owns_passkeys?
  end

  def registration_options?
    owns_passkeys?
  end

  def create?
    owns_passkeys?
  end

  def update_requirement?
    owns_passkeys?
  end

  def destroy?
    owns_passkeys?
  end

  private

    def owns_passkeys?
      user.present? && record == user
    end
end
