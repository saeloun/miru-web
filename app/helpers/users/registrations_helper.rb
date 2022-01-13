# frozen_string_literal: true

module Users::RegistrationsHelper
  def error_message_on(resource, attribute)
    return unless resource.respond_to?(:errors) && resource.errors.include?(attribute)
    error = field_error(resource, attribute)

    content_tag(:div, error, class: "tracking-wider block text-xs font-semibold text-red-600")
  end

  def error_message_class(resource, attribute)
    if resource.respond_to?(:errors) && resource.errors.include?(attribute)
      "rounded tracking-wider appearance-none border border-red-600 block w-full px-3 py-2 bg-miru-gray-100 h-8 shadow-sm font-semibold text-xs text-miru-dark-purple-1000 focus:outline-none focus:ring-red-600 focus:border-red-600 sm:text-base"
    else
      "rounded tracking-wider appearance-none border border-gray-100 block w-full px-3 py-2 bg-miru-gray-100 h-8 shadow-sm font-semibold text-xs text-miru-dark-purple-1000 focus:outline-none focus:ring-miru-gray-1000 focus:border-miru-gray-1000 sm:text-base"
    end
  end

  private
    def field_error(resource, attribute)
      resource.errors[attribute].first
    end
end
