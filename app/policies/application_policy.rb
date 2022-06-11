# frozen_string_literal: true

class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def user_owner_or_admin_or_book_keeper_role?(resource = user.current_workspace)
    user.has_owner_or_admin_or_book_keeper_role?(resource)
  end

  def user_owner_or_admin_or_employee?(resource = user.current_workspace)
    user.has_owner_or_admin_or_employee_role?(resource)
  end

  def user_owner_or_admin?(resource = user.current_workspace)
    user.has_owner_or_admin_role?(resource)
  end
end
