# frozen_string_literal: true

class TruncateCompanyNameToCompany < ActiveRecord::Migration[7.0]
  def change
    Company.find_each do |company|
      company.update(name: company.name.slice(0, 30), business_phone: company.business_phone.slice(0, 15))
    end
  end
end
