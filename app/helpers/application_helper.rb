# frozen_string_literal: true

module ApplicationHelper
  def app_name
    @app_name ||= Rails.configuration.x.app_name || "Miru Agency OS"
  end

  def user_avatar(user)
    user&.avatar_url.presence || image_url("avatar.svg")
  end
end
