# frozen_string_literal: true

# == Schema Information
#
# Table name: leaves
#
#  id           :bigint           not null, primary key
#  discarded_at :datetime
#  year         :integer
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  company_id   :bigint           not null
#
# Indexes
#
#  index_leaves_on_company_id           (company_id)
#  index_leaves_on_discarded_at         (discarded_at)
#  index_leaves_on_year_and_company_id  (year,company_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require "rails_helper"

RSpec.describe Leave, type: :model do
  let(:company) { create(:company) }

  describe "validations" do
    it "is valid with valid attributes" do
      leave = build(:leave, company:, year: 2023)
      expect(leave).to be_valid
    end

    it "is not valid without a year" do
      leave = build(:leave, company:, year: nil)
      expect(leave).not_to be_valid
      expect(leave.errors[:year]).to include("can't be blank")
    end

    it "is not valid with a year less than 1000" do
      leave = build(:leave, company:, year: 999)
      expect(leave).not_to be_valid
      expect(leave.errors[:year]).to include("must be greater than or equal to 1000")
    end

    it "is not valid with a year greater than 9999" do
      leave = build(:leave, company:, year: 10000)
      expect(leave).not_to be_valid
      expect(leave.errors[:year]).to include("must be less than or equal to 9999")
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to have_many(:leave_types).dependent(:destroy) }
  end
end
