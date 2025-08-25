# frozen_string_literal: true

class Api::V1::Companies::PurgeLogoController < Api::V1::ApplicationController
  def destroy
    authorize current_company, :purge_logo?
    current_company.logo.destroy
    render json: { notice: I18n.t("companies.purge_logo.destroy.success") }, status: 200
  end
end
