# == Schema Information
#
# Table name: companies
#
#  id              :integer          not null, primary key
#  name            :string           not null
#  address         :text             not null
#  business_phone  :string
#  base_currency   :string           default("USD"), not null
#  standard_price  :decimal(, )      default("0.0"), not null
#  fiscal_year_end :string
#  date_format     :string
#  country         :string           not null
#  timezone        :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#

# frozen_string_literal: true

class Company < ApplicationRecord
  has_many :users, dependent: :destroy
  has_many :clients, dependent: :destroy
  has_many :projects, through: :clients, dependent: :destroy
  has_one_attached :logo

  validates :name, :business_phone, :standard_price, :country, :base_currency, presence: true
  validates :standard_price, numericality: { greater_than_or_equal_to: 0 }
end
