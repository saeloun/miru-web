# frozen_string_literal: true

module ApplicationHelper
  def user_avatar(user)
    if user.avatar.attached?
      user.avatar
    else
      image_url "avatar.svg"
    end
  end
end
