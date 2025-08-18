# frozen_string_literal: true

class Api::V1::Companies::PurgeLogoController < Api::V1::BaseController
  before_action :set_company
  after_action :verify_authorized

  def destroy
    authorize @company, :update?

    if @company.logo.attached?
      @company.logo.purge
      render json: { notice: "Logo removed successfully" }, status: 200
    else
      render json: { error: "No logo to remove" }, status: :unprocessable_entity
    end
  end

  private

    def set_company
      @company = current_user.current_workspace || current_user.companies.first
    end
end
