# frozen_string_literal: true

class Clients::InvoicesPolicy < ApplicationPolicy
  def index?
    user_client_role?
  end
end
