# frozen_string_literal: true

class Users::InvitationsController < Devise::InvitationsController
  after_action :assign_company, only: [:create]
  after_action :assign_role, only: [:create]

  protected

    def assign_company
      resource.companies << current_company
    end

    def assign_role
      if resource.errors.empty? && current_company
        resource.add_role(params[:user][:roles].downcase.to_sym, current_company)
      end
    end

    def after_invite_path_for(inviter)
      team_index_path
    end
end
