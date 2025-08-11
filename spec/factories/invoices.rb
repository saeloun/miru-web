# frozen_string_literal: true

# == Schema Information
#
# Table name: invoices
#
#  id                     :bigint           not null, primary key
#  amount                 :decimal(20, 2)   default(0.0)
#  amount_due             :decimal(20, 2)   default(0.0)
#  amount_paid            :decimal(20, 2)   default(0.0)
#  base_currency_amount   :decimal(20, 2)   default(0.0)
#  client_payment_sent_at :datetime
#  currency               :string           default("USD"), not null
#  discarded_at           :datetime
#  discount               :decimal(20, 2)   default(0.0)
#  due_date               :date
#  external_view_key      :string
#  invoice_number         :string
#  issue_date             :date
#  outstanding_amount     :decimal(20, 2)   default(0.0)
#  payment_infos          :jsonb
#  payment_sent_at        :datetime
#  reference              :text
#  sent_at                :datetime
#  status                 :integer          default("draft"), not null
#  stripe_enabled         :boolean          default(TRUE)
#  tax                    :decimal(20, 2)   default(0.0)
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  client_id              :bigint           not null
#  company_id             :bigint
#
# Indexes
#
#  index_invoices_on_client_id                      (client_id)
#  index_invoices_on_company_id                     (company_id)
#  index_invoices_on_discarded_at                   (discarded_at)
#  index_invoices_on_due_date                       (due_date)
#  index_invoices_on_external_view_key              (external_view_key) UNIQUE
#  index_invoices_on_invoice_number_and_company_id  (invoice_number,company_id) UNIQUE
#  index_invoices_on_invoice_number_trgm            (invoice_number) USING gin
#  index_invoices_on_issue_date                     (issue_date)
#  index_invoices_on_status                         (status)
#
# Foreign Keys
#
#  fk_rails_...  (client_id => clients.id)
#  fk_rails_...  (company_id => companies.id)
#
FactoryBot.define do
  factory :invoice do
    transient do
      amount_value { Faker::Number.decimal(r_digits: 2) }
    end

    company
    client
    issue_date { Faker::Date.between(from: "2019-04-01", to: Date.today) }
    due_date { Faker::Date.between(from: self.issue_date, to: Date.today) }
    invoice_number { Faker::Alphanumeric.unique.alpha(number: 4) }
    reference { Faker::Invoice.reference[1..12] }
    amount { amount_value }
    # outstanding_amount { Faker::Number.decimal(r_digits: 2) }
    # tax { Faker::Number.decimal(r_digits: 2) }
    # amount_paid { Faker::Number.decimal(r_digits: 2) }
    # amount_due { Faker::Number.decimal(r_digits: 2) }
    # discount { Faker::Number.decimal(r_digits: 2) }
    status { :draft }
    base_currency_amount { amount_value }
    external_view_key { "#{SecureRandom.hex}" }
    factory :invoice_with_invoice_line_items do
      transient do
        length { 5 }
      end
      invoice_line_items { Array.new(length) { association(:invoice_line_item) } }
    end
  end
end
