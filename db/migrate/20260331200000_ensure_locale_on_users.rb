# frozen_string_literal: true

class EnsureLocaleOnUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :locale, :string, default: "en", null: false unless column_exists?(:users, :locale)
  end
end
