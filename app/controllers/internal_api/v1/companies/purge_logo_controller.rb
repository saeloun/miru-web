# frozen_string_literal: true

class InternalApi::V1::Companies::PurgeLogoController < InternalApi::V1::ApplicationController
  def destroy
    authorize current_company, :purge_logo?
    current_company.logo.destroy
    render json: { notice: I18n.t("companies.purge_logo.destroy.success") }, status: 200
  end
end
