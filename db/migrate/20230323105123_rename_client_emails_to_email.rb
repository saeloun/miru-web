# frozen_string_literal: true

class RenameClientEmailsToEmail < ActiveRecord::Migration[7.0]
  def change
    safety_assured { rename_column :clients, :emails, :email }
  end
end
