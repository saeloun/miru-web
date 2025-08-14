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
require "rails_helper"

RSpec.describe PaymentsProvider, type: :model do
  subject { build(:payments_provider) }

  describe "Validations" do
    describe "uniqueness" do
      it { is_expected.to validate_uniqueness_of(:name).scoped_to(:company_id) }
    end

    describe "inclusion" do
      it { is_expected.to validate_inclusion_of(:name).in_array(%w(stripe paypal wise)) }
    end
  end

  describe "Associations" do
    describe "belongs_to" do
      it { is_expected.to belong_to(:company) }
    end
  end
end
