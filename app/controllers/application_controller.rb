# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include DeviseWhitelist
  include PunditConcern
  include ErrorHandler
  include CurrentCompanyConcern
  include Pagy::Backend

  before_action :authenticate_user!, :validate_company!
  before_action do
    ActiveStorage::Current.url_options = { protocol: request.protocol, host: request.host, port: request.port }
  end

  private

    def validate_company!
      return if current_user.nil? || devise_controller?

      authorize current_company, :company_present?, policy_class: CompanyPolicy
    end
end
