# frozen_string_literal: true

class ClientPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy
    def initialize(user, company)
      @user = user
      @scope = company
    end

    def resolve
      if user_owner_role? || user_admin_role?
        scope.clients.kept.order(:name)
      else
        user.clients.kept
          .where(company_id: scope.id)
          .merge(user.project_members.kept)
          .order(:name)
          .distinct
      end
    end

    private

      attr_reader :user, :scope
  end

  attr_reader :error_message_key

  def index?
    user_employee_role? || user_owner_role? || user_admin_role?
  end

  def show?
    authorize_current_user
  end

  def create?
    user_owner_role? || user_admin_role?
  end

  def update?
    authorize_current_user
  end

  def destroy?
    authorize_current_user
  end

  def send_payment_reminder?
    user_admin_role? || user_owner_role?
  end

  def add_client_contact?
    user_admin_role? || user_owner_role?
  end

  def permitted_attributes
    [
      :name,
      :phone,
      :email,
      :logo,
      :currency,
      addresses_attributes: [:id, :address_line_1, :address_line_2, :city, :state, :country, :pin]
    ]
  end

  def authorize_current_user
    unless user.current_workspace_id == record.company_id
      @error_message_key = :different_workspace
      return false
    end

    user_owner_role? || user_admin_role?
  end
end
