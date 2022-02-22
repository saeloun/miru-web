# frozen_string_literal: true

class CreateCompanyUsers < ActiveRecord::Migration[7.0]
  def up
    return unless User.column_names.include?("company_id")

    User.find_each do |user|
      user.company_users.create(company_id: user.company_id)
    end
  end

  def down
    return unless User.column_names.include?("company_id")

    CompanyUser.find_each do |company_user|
      next if company_user.user.company_id?

      company_user.user.update(company_id: company_user.company_id)
    end
  end
end
