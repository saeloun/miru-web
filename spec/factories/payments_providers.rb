# frozen_string_literal: true

# == Schema Information
#
# Table name: payments_providers
#
#  id                       :bigint           not null, primary key
#  accepted_payment_methods :string           default([]), is an Array
#  connected                :boolean          default(FALSE)
#  enabled                  :boolean          default(FALSE)
#  name                     :string           not null
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  company_id               :bigint           not null
#
# Indexes
#
#  index_payments_providers_on_company_id           (company_id)
#  index_payments_providers_on_connected            (connected)
#  index_payments_providers_on_enabled              (enabled)
#  index_payments_providers_on_name_and_company_id  (name,company_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
FactoryBot.define do
  factory :payments_provider do
    association :company, factory: :company
    sequence :name, %w(stripe paypal wise).cycle
    connected { false }
    enabled { false }
    accepted_payment_methods { ["card", "ach"] }
  end
end
