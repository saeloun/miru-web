# frozen_string_literal: true

class PreviousEmploymentPolicy < ApplicationPolicy
  class Scope
    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      if id_admin_or_owner?
        scope.all
      else
        scope.where(user_id: user.id)
      end
    end

    private

      attr_reader :user, :scope, :queried_user

      def id_admin_or_owner?
        user.has_any_role?(
          { name: :admin, resource: user.current_workspace },
          { name: :owner, resource: user.current_workspace })
      end
  end

  def show?
    (record.user.employee_of?(user.current_workspace_id) &&
    id_admin_or_owner?) || record_belongs_to_user?
  end

  def index?
    user.employee_of?(user.current_workspace_id) ||
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace })
  end

  def update?
    show?
  end

  def create?
    index?
  end
end
