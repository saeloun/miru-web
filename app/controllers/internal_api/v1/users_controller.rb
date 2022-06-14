# frozen_string_literal: true

class InternalApi::V1::UsersController < Devise::InvitationsController
  include PunditHelper
  include ErrorHandler
  include CurrentCompanyConcern

  before_action :authenticate_user!
  after_action :assign_company, only: [:create]
  after_action :assign_role, only: [:create]

  def create
    authorize User
    super do |resource|
      if resource.errors.empty?
        render json: { notice: I18n.t("User.invite.success") }, status: 200 and return
      else
        render json: resource.errors, status: 401 and return
      end
    end
  end

  protected

    def assign_company
      resource.companies << current_company
    end

    def assign_role
      if resource.errors.empty? && current_company
        resource.add_role(params[:user][:roles].downcase.to_sym, current_company)
      end
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
      User.find_by(email: invite_params[:email])
    end

    def send_confirmation_email
      # https://github.com/scambra/devise_invitable/blob/7c4b1f6d19135b2cfed4685735a646a28bbc5191/lib/devise_invitable/models.rb#L211
      invited_user.send_devise_notification(:invitation_instructions, invited_user.invitation_token)
    end
end
