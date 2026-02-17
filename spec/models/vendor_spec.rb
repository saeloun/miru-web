# frozen_string_literal: true

# == Schema Information
#
# Table name: vendors
#
#  id         :bigint           not null, primary key
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  company_id :bigint           not null
#
# Indexes
#
#  index_vendors_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require "rails_helper"

RSpec.describe Vendor, type: :model do
  subject { build(:vendor) }

  describe "Validations" do
    it { is_expected.to validate_presence_of(:name) }
  end

  describe "Associations" do
    it { is_expected.to have_many(:expenses) }
    it { is_expected.to belong_to(:company) }
  end
end
