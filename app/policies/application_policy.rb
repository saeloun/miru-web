# frozen_string_literal: true

class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  private
    def user_owner_or_admin?
      user.has_any_role?(:owner, :admin)
    end
end
