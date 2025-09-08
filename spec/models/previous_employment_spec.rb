# frozen_string_literal: true

# == Schema Information
#
# Table name: previous_employments
#
#  id           :bigint           not null, primary key
#  company_name :string
#  role         :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_previous_employments_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
require "rails_helper"

RSpec.describe PreviousEmployment, type: :model do
  subject { build(:previous_employment) }

  describe "Associations" do
      it { is_expected.to belong_to(:user) }
    end

  describe "Validations" do
    it { is_expected.to validate_length_of(:company_name).is_at_most(50) }
    it { is_expected.to validate_length_of(:role).is_at_most(50) }
    it { is_expected.to validate_presence_of(:company_name) }
    it { is_expected.to validate_presence_of(:role) }
  end
end
