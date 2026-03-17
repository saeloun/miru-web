# frozen_string_literal: true

class ValidatePasskeysUserForeignKey < ActiveRecord::Migration[8.0]
  def change
    validate_foreign_key :passkeys, :users
  end
end
