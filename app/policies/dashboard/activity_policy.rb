# frozen_string_literal: true

class Dashboard::ActivityPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role? || user_book_keeper_role? || user_employee_role? || user_client_role?
  end
end
