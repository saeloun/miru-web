# frozen_string_literal: true

class CreateCompanyUsers < ActiveRecord::Migration[7.0]
  def create_company_users
    return unless User.column_names.include?("company_id")

    User.find_each do |user|
      user.company_users.create(company_id: user.company_id)
    end
  end

  def move_company_user_to_user
    return unless User.column_names.include?("company_id")

    CompanyUser.find_each do |company_user|
      next if company_user.user.company_id?

      company_user.user.update(company_id: company_user.company_id)
    end
  end

  def up
    create_table :company_users do |t|
      t.references :company, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end

    create_company_users
  end

  def down
    move_company_user_to_user

    drop_table :company_users
  end
end
