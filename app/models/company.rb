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
  # Associations
  has_many :company_users, dependent: :destroy
  has_many :users, through: :company_users
  has_many :timesheet_entries, through: :users
  has_many :clients, dependent: :destroy
  has_many :projects, through: :clients, dependent: :destroy
  has_many :current_workspace_users, foreign_key: "current_workspace_id", class_name: "User", dependent: :nullify
  has_one_attached :logo
  has_many :timesheet_entries, through: :clients
  has_many :invoices, through: :clients
  resourcify

  # Validations
  validates :name, :business_phone, :standard_price, :country, :base_currency, presence: true
  validates :standard_price, numericality: { greater_than_or_equal_to: 0 }

  def client_details(time_frame = "week")
    clients.kept.map { |client| client.client_detail(time_frame) }
  end

  def client_list
    clients.kept.map do |client|
      { id: client.id, name: client.name, email: client.email, phone: client.phone, address: client.address }
    end
  end

  def invoice_amount_calculation
    overdue_amount = [], outstanding_amount = [], draft_amount = [], paid_amount = []
    invoices.each do |invoice|
      case invoice.status
      when "draft"
        draft_amount.push(invoice[:amount])
      when "overdue"
        overdue_amount.push(invoice[:amount])
      when "paid"
        paid_amount.push(invoice[:amount])
      end
      outstanding_amount.push(invoice[:amount])
    end
    {
      overdue_amount: overdue_amount.sum,
      outstanding_amount: (outstanding_amount.sum - paid_amount.sum - draft_amount.sum),
      draft_amount: draft_amount.sum
    }
  end

  def user_details
    users.kept.map do |user|
      {
        id: user.id,
        name: user.full_name
      }
    end
  end
end
