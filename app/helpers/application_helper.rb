# frozen_string_literal: true

module ApplicationHelper
  def app_name
    @app_name ||= begin
      configured_name = Rails.configuration.x.app_name
      configured_name.is_a?(String) && configured_name.present? ? configured_name : "Miru Agency OS"
    end
  end

  def user_avatar(user)
    user&.avatar_url.presence || image_url("avatar.svg")
  end
end
