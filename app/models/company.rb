# == Schema Information

# Table name: companies
#
#  id              :integer          not null, primary key
#  name            :string           not null
#  address         :text             not null
#  business_phone  :string           not null
#  base_currency   :string           not null
#  standard_price  :decimal(6, 2)    default("0.0")
#  fiscal_year_end :string           not null
#  date_format     :integer          default("1")
#  country         :string           not null
#  timezone        :decimal(4, 2)    default("0.0"), not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#

# frozen_string_literal: true

class Company < ApplicationRecord
  has_many :users

  validates :name, null: false
  validates :address, null: false
  validates :business_phone, null: false
  validates :base_currency, null: false
  validates :fiscal_year_end, null: false
  validates :country, null: false
  validates :standard_price, null: false, default: 0.0
  validates :timezone, null: false, default: 0.0
end
