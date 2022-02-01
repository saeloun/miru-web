# frozen_string_literal: true

module CompanyHelper
  def error_message_on(resource, attribute)
    return unless resource.respond_to?(:errors) && resource.errors.include?(attribute)
    error = field_error(resource, attribute)

    content_tag(:div, error, class: "tracking-wider block text-xs text-red-600")
  end

  def error_message_class(resource, attribute)
    if resource.respond_to?(:errors) && resource.errors.include?(attribute)
      "rounded tracking-wider border border-red-600 block w-full px-3 py-2 bg-miru-gray-100 shadow-sm text-xs text-miru-dark-purple-1000 focus:outline-none focus:ring-red-600 focus:border-red-600"
    else
      "rounded tracking-wider border border-gray-100 block w-full px-3 py-2 bg-miru-gray-100 shadow-sm text-xs text-miru-dark-purple-1000 focus:outline-none focus:ring-miru-gray-1000 focus:border-miru-gray-1000"
    end
  end

  private
    def field_error(resource, attribute)
      resource.errors[attribute].first
    end
end
