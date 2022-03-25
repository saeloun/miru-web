# frozen_string_literal: true

class GenerateInvoicePolicy < ApplicationPolicy
  def index?
    user_owner_or_admin?
  end
end
