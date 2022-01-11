# frozen_string_literal: true

require_relative "20211216064133_add_roles_to_user"

class RemoveRolesFromUser < ActiveRecord::Migration[7.0]
  def change
    revert AddRolesToUser
  end
end
