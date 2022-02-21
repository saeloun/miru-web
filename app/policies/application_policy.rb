# frozen_string_literal: true

class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  private
    def user_owner_or_admin?
      user.has_owner_or_admin_role?(user.current_workspace)
    end
end
