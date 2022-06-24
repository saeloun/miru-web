# frozen_string_literal: true

class PaymentPolicy < ApplicationPolicy
  def index?
    # user_book_keeper_role? || user_owner_role? || user_admin_role?
    false # TODO: Temprary disabling this feature (navebar payment links)
  end
end
