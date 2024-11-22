# frozen_string_literal: true

class PaymentSettingsPolicy < ApplicationPolicy
  def index?
    has_owner_or_admin_role?(record)
  end

  def connect_stripe?
    has_owner_or_admin_role?(record)
  end

  def destroy?
    has_owner_or_admin_role?(record)
  end

  def refresh_stripe_connect?
    has_owner_or_admin_role?(record)
  end

  def update_bank_account?
    has_owner_or_admin_role?(record)
  end

  private

    def has_owner_or_admin_role?(company)
      user.has_any_role?(
        { name: :admin, resource: company },
        { name: :owner, resource: company }
      )
    end
end
