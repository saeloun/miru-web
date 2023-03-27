# frozen_string_literal: true

class RemoveClientEmail < ActiveRecord::Migration[7.0]
  def change
    # https://www.rubydoc.info/gems/strong_migrations/0.7.6
    safety_assured { remove_column :clients, :email }
  end
end
