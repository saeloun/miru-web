# frozen_string_literal: true

require "rails_helper"

RSpec.describe WiseAccount, type: :model, wise: true do
  describe "Validations" do
    subject { build(:wise_account) }

    describe "uniqueness validations" do
      it { is_expected.to validate_uniqueness_of(:user_id).scoped_to(:company_id) }
    end
  end
end
