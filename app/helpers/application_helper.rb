# frozen_string_literal: true

module ApplicationHelper
  def user_avatar(user)
    if user.avatar.attached?
      user.avatar
    else
      image_url "avtar.svg"
    end
  end
end
