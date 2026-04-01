# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include DeviseWhitelist
  include PunditConcern
  include ErrorHandler
  include CurrentCompanyConcern
  include Pagy::Backend
  include SetCurrentDetails

  # Vite handles asset compilation

  around_action :switch_locale
  before_action :authenticate_user!

  private

    def switch_locale(&action)
      locale = locale_from_request
      I18n.with_locale(locale, &action)
    end

    def locale_from_request
      LocaleConfig.normalize(
        params[:locale].presence ||
        current_user_locale ||
        request.headers["X-Miru-Locale"].presence ||
        LocaleConfig.from_accept_language(request.headers["Accept-Language"])
      ).to_sym
    end

    def current_user_locale
      current_user&.respond_to?(:locale) ? current_user&.locale : nil
    end
end
