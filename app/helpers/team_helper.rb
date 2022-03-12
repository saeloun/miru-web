# frozen_string_literal: true

module TeamHelper
  def resource_name
    :user
  end

  def resource
    @_resource ||= User.new
  end

  def devise_mapping
    @_devise_mapping ||= Devise.mappings[:user]
  end
end
