# frozen_string_literal: true

class Users::InvitationsController < Devise::InvitationsController
  after_action :assign_company, only: [:create]
  after_action :assign_role, only: [:create]

  protected

    def assign_company
      unless invited_user.errors.present? ||
          invited_user.companies.exists?(id: current_company.id)
        invited_user.companies << current_company
      end
    end

    def assign_role
      if invited_user.errors.empty? && current_company
        invited_user.add_role(params[:user][:roles].downcase.to_sym, current_company)
      end
    end

    def after_invite_path_for(inviter)
      team_index_path
    end

  private

    def invite_resource
      if invited_user.present? && invited_user.invitation_accepted_at.present?
        send_confirmation_email
        return invited_user
      end

      super
    end

    def invited_user
      User.find_by(email: invite_params[:email])
    end

    def send_confirmation_email
      # https://github.com/scambra/devise_invitable/blob/7c4b1f6d19135b2cfed4685735a646a28bbc5191/lib/devise_invitable/models.rb#L211
      invited_user.send_devise_notification(:invitation_instructions, invited_user.invitation_token)
    end
end
