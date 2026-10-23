# frozen_string_literal: true

class AddBrowserTrustVersionToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :browser_trust_version, :integer, default: 0, null: false
  end
end
