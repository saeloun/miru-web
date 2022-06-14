# frozen_string_literal: true

class AddCompanyUserToEmploymentDetails < ActiveRecord::Migration[7.0]
  def change
    add_reference :employment_details, :company_user, null: false, foreign_key: true
  end
end
