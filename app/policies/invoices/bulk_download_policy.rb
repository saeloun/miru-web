# frozen_string_literal: true

class Invoices::BulkDownloadPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role? || user_book_keeper_role?
  end

  def status?
    user_owner_role? || user_admin_role? || user_book_keeper_role?
  end
end
