# frozen_string_literal: true

class Users::InvitationsController < Devise::InvitationsController
  def create
    authorize current_user, policy_class: Users::InvitationsPolicy

    if User.exists?(email: invite_params[:email])
      add_company_user_and_role
      send_confirmation_email(nil)
      respond_with invited_user, location: after_invite_path_for(invited_user)
    else
      super
      add_company_user_and_role
    end
  end

  protected

    def add_company_user_and_role
      invited_user.current_company = current_company
      invited_user.role = params[:user][:roles]
      invited_user.assign_company_and_role
    end

    def after_invite_path_for(inviter)
      team_index_path
    end

  private

    def invite_resource
      if invited_user.present?
        send_confirmation_email
        return invited_user
      end

      super
    end

    def invited_user
      find_invited_user || resource
    end

    def find_invited_user
      @_find_invited_user ||= User.find_by(email: invite_params[:email])
    end

    def send_confirmation_email(invitation_token = invited_user.invitation_token)
      # https://github.com/scambra/devise_invitable/blob/7c4b1f6d19135b2cfed4685735a646a28bbc5191/lib/devise_invitable/models.rb#L211
      invited_user.send_devise_notification(:invitation_instructions, invitation_token)
    end
end
