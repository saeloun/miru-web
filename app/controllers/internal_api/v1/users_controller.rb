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
end
