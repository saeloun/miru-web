# == Schema Information
#
# Table name: companies
#
#  id              :integer          not null, primary key
#  company         :string
#  address         :text
#  business_phone  :integer
#  base_currency   :decimal(, )
#  standard_price  :decimal(, )
#  fiscal_year_end :string
#  date            :date
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#

# frozen_string_literal: true

class Company < ApplicationRecord
  has_many :users
end
