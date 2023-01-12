# frozen_string_literal: true

require "rails_helper"

RSpec.describe Vendor, type: :model do
  subject { build(:vendor) }

  describe "Validations" do
    it { is_expected.to validate_presence_of(:name) }
  end

  describe "Associations" do
    it { is_expected.to have_many(:expenses) }
  end
end
