# frozen_string_literal: true

module Team
  class UpdateService < ApplicationService
    attr_reader :actor, :user_params, :current_company, :new_role, :user, :current_role

    def initialize(actor:, user_params:, current_company:, new_role:, user:)
      @actor = actor
      @user = user
      @user_params = user_params
      @current_company = current_company
      @current_role = user.roles.find_by(resource: current_company)&.name&.to_sym
      @new_role = new_role.to_s.downcase.to_sym
    end

    def process
      validate_role!
      authorize_role_change!

      User.transaction do
        # skip confirmation email as changes are made by admin and it dosen't change email
        user.skip_reconfirmation!
        user.update!(user_params)
        update_company_user_role
        user
      end
    end

    private

      def validate_role!
        return if ApplicationPolicy::ROLES.include?(new_role)

        user.errors.add(:role, :inclusion)
        raise ActiveRecord::RecordInvalid.new(user)
      end

      def authorize_role_change!
        return if current_role == new_role

        raise Pundit::NotAuthorizedError if actor == user
        raise Pundit::NotAuthorizedError if new_role == :owner && !actor.has_role?(:owner, current_company)
        raise Pundit::NotAuthorizedError if current_role == :owner && !actor.has_role?(:owner, current_company)
      end

      def update_company_user_role
        return if current_role == new_role

        if current_role.present?
          user.remove_role(current_role, current_company)
        end

        user.add_role(new_role, current_company)
        audit_role_change
      end

      def audit_role_change
        Audited::Audit.create!(
          auditable: user,
          associated: current_company,
          user: actor,
          action: "update",
          audited_changes: { "role" => [current_role.to_s, new_role.to_s] },
          comment: "Workspace role changed"
        )
      end
  end
end
