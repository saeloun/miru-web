# frozen_string_literal: true

class TeamController < ApplicationController
  skip_after_action :verify_authorized, only: :index
  after_action :assign_role, only: [:update]

  def new
    @invitation = Invitation.new
  end

  def index
    # TODO: need to update either the search form or search logic in later PRs
    query = current_company.users.includes([:avatar_attachment, :roles]).ransack(params[:q])
    invitations_query = current_company.invitations.valid_invitations
      .ransack(first_name_or_last_name_or_recipient_email_cont: params.dig(:q, :first_name_or_last_name_or_email_cont))
    teams = query.result(distinct: true)
    invitations = invitations_query.result(distinct: true)
    render :index, locals: { query:, teams:, invitations: }
  end

  #   def edit
  #     authorize user, policy_class: TeamPolicy
  #     @user = user
  #   end

  def update
    authorize user, policy_class: TeamPolicy
    user.skip_reconfirmation!
    user.update!(user_params)
    redirect_to team_index_path
  end

  #   def destroy
  #     authorize user, policy_class: TeamPolicy
  #     user.discard
  #     redirect_to team_index_path
  #   end

  #   private

  #     def user_params
  #       params.require(:user).permit(policy(:team).permitted_attributes)
  #     end

  #     def user
  #       @_user ||= User.kept.find(params[:id])
  #     end

  # def assign_role
  #   return flash[:error] = I18n.t("team.update.error.role") if params.dig(:user, :roles).nil?

  #   user.remove_role(user.roles.first.name) if user.roles.present?
  #   if user.errors.empty? && current_company.present?
  #     user.add_role(params[:user][:roles].downcase.to_sym, current_company)
  #   end
  # end
end
