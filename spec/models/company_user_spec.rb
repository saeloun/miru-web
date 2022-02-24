# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompanyUser, type: :model do
  describe "Associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:user) }
  end
end
