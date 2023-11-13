# frozen_string_literal: true

class AddVirtualVerifyToInvitations < ActiveRecord::Migration[7.0]
  def change
    add_column :invitations, :virtual_verified, :boolean, default: false
  end
end
