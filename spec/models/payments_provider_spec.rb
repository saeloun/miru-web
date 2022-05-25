# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentsProvider, type: :model do
  subject { build(:payments_provider) }

  describe "Validations" do
    describe "uniqueness" do
      it { is_expected.to validate_uniqueness_of(:name).scoped_to(:company_id) }
    end

    describe "inclusion" do
      it { is_expected.to validate_inclusion_of(:name).in_array(%w(stripe, paypal, wise)) }
    end
  end

  describe "Associations" do
    describe "belongs_to" do
      it { is_expected.to belong_to(:company) }
    end
  end
end
