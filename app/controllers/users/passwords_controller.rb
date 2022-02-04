# frozen_string_literal: true

class Users::PasswordsController < Devise::PasswordsController
  def create
    super do |resource|
      set_flash_error(resource)
    end
  end

  def update
    super do |resource|
      set_flash_error(resource)
    end
  end


  private
    def set_flash_error(resource)
      if resource.errors.any?
        resource.errors.full_messages.each do |message|
          flash.now[:error] = message
        end
      end
    end
end
