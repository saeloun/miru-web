# == Schema Information
#
# Table name: companies
#
#  id              :integer          not null, primary key
#  name            :string           not null
#  address         :text             not null
#  business_phone  :string
#  base_currency   :string
#  standard_price  :decimal(6, 2)    not null
#  fiscal_year_end :string
#  date_format     :string
#  country         :string           not null
#  timezone        :string
#  logo_url        :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#

# frozen_string_literal: true

class Company < ApplicationRecord
  has_many :users

  validates :name, :address, :standard_price, :country, preserence: true
  validates :base_currency, default: "USD"
  validates :standard_price, default: 0
end
