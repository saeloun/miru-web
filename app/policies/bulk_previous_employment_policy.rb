# frozen_string_literal: true

class BulkPreviousEmploymentPolicy < ApplicationPolicy
  def update?
    has_owner_or_admin_role? || record.id == user.id
  end
end
