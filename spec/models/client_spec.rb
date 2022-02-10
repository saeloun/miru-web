# frozen_string_literal: true

require "rails_helper"

RSpec.describe Client, type: :model do
  subject { FactoryBot.build(:client) }

  it { is_expected.to validate_presence_of(:name) }
  it { is_expected.to validate_presence_of(:email) }
  it { is_expected.to validate_uniqueness_of(:email) }
  it { is_expected.to allow_value("valid@email.com").for(:email) }
  it { is_expected.not_to allow_value("invalid@email").for(:email) }
  it { is_expected.to validate_uniqueness_of(:email) }
  it { is_expected.to have_many(:projects) }
  it { is_expected.to have_many(:timesheet_entries) }
  it { is_expected.to belong_to(:company) }
end
