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
    amount_calculation = invoices.group(:status).sum(:amount)
    sent_amount = amount_calculation["sent"] || 0
    viewed_amount = amount_calculation["viewed"] || 0
    overdue_amount = amount_calculation["overdue"] || 0
    draft_amount = amount_calculation["draft"] || 0
    {
      overdue_amount:,
      outstanding_amount: sent_amount + viewed_amount + overdue_amount,
      draft_amount:
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
