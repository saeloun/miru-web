# frozen_string_literal: true

# == Schema Information
#
# Table name: carryovers
#
#  id                  :bigint           not null, primary key
#  discarded_at        :datetime
#  duration            :integer
#  from_year           :integer
#  to_year             :integer
#  total_leave_balance :integer
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  company_id          :bigint           not null
#  leave_type_id       :bigint           not null
#  user_id             :bigint           not null
#
# Indexes
#
#  index_carryovers_on_company_id     (company_id)
#  index_carryovers_on_discarded_at   (discarded_at)
#  index_carryovers_on_leave_type_id  (leave_type_id)
#  index_carryovers_on_user_id        (user_id)
#
require "rails_helper"

RSpec.describe Carryover, type: :model do
  subject { build(:carryover) }

  describe "Associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:leave_type) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:from_year) }
    it { is_expected.to validate_presence_of(:to_year) }
    it { is_expected.to validate_presence_of(:total_leave_balance) }
    it { is_expected.to validate_presence_of(:duration) }
  end
end
