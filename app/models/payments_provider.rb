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
#  index_payments_providers_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
class PaymentsProvider < ApplicationRecord
  belongs_to :company

  validates :name, uniqueness: { scope: :company_id }
  validates :name, inclusion: { in: %w(stripe, paypal, wise) }
end
