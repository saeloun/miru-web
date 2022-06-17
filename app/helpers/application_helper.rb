# frozen_string_literal: true

module ApplicationHelper
  def user_avatar(user)
    if user.avatar.attached?
      user.avatar
    else
      image_url "avatar.svg"
    end
  end

  def company_logo(company)
    if company.logo.attached?
      company.logo
    else
      image_url "company.svg"
    end
  end

  def error_message_on(resource, attribute)
    return unless resource.respond_to?(:errors) && resource.errors.include?(attribute)

    field_error(resource, attribute)
  end

  def error_message_class(resource, attribute)
    if resource.respond_to?(:errors) && resource.errors.include?(attribute)
      "border-red-600 focus:ring-red-600 focus:border-red-600"
    else
      "border-gray-100 focus:ring-miru-gray-1000 focus:border-miru-gray-1000"
    end
  end

  def auth_brand_logo
    content_tag(:div, class: "mx-auto h-16 w-auto text-center") do
      content_tag(:span, class: "text-col-red-400 font-bold text-5xl") do
        "A#{content_tag(:span, "∝C", class: "text-col-black-1000 font-bold text-5xl")}".html_safe
      end
    end
  end

  private

    def field_error(resource, attribute)
      resource.errors[attribute].first
    end
end
