# frozen_string_literal: true

class Companies::PurgeLogoController < ApplicationController
  def destroy
    current_company.logo.destroy
    redirect_to company_path
  end
end
