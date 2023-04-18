# frozen_string_literal: true

class ChangeCompanyAddressToNull < ActiveRecord::Migration[7.0]
  def change
    change_column_null :companies, :address, true
  end
end
