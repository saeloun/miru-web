# frozen_string_literal: true

module Expenses
  class ExpensesSummaryPolicy < ApplicationPolicy
    def index?
      user_owner_role? || user_admin_role? || user_book_keeper_role?
    end
  end
end
