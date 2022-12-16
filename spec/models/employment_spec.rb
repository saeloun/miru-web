# frozen_string_literal: true

require "rails_helper"

RSpec.describe Employment, type: :model do
  let(:employment) { create(:employment) }
  let(:company) { employment.company }
  let(:user) { employment.user }

  describe "Associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:user) }
  end

  describe "Discard" do
    it "discards the employments" do
      expect { employment.discard! }.to change(company.employments.discarded, :count).by(1)
      expect(employment.reload.discarded?).to be_truthy
      expect(user.reload.employments.discarded.count).to eq(1)
    end

    it "does not discard the employments if already discarded" do
      employment.discard!
      expect { employment.discard! }.to raise_error(Discard::RecordNotDiscarded)
    end
  end

  describe "#new" do
    let(:employment) { build(:employment) }

    it "adds deafult 40 hours for the employment" do
      expect(employment.fixed_working_hours).to eq 40
    end

    it "adds 0 as a balance PTO" do
      expect(employment.balance_pto).to eq 0
    end

    context "when working hours are not present" do
      let(:employment) { build(:employment, :without_working_hours) }

      it "adds validation error" do
        expect(employment.valid?).to be false
        expect(employment.errors.full_messages.first).to eq "Fixed working hours can't be blank"
      end
    end

    context "when balance pto is missing" do
      let(:employment) { build(:employment, :without_balance_pto) }

      it "adds validation error" do
        expect(employment.valid?).to be false
        expect(employment.errors.full_messages.first).to eq "Balance pto can't be blank"
      end
    end
  end

  # TODO:- To be uncommented after UI integration is done
  # describe "Validations" do
  # it { is_expected.to validate_presence_of(:designation) }
  # it { is_expected.to validate_presence_of(:employment_type) }
  # it { is_expected.to validate_presence_of(:joined_at) }
  # it { is_expected.to validate_presence_of(:employee_id) }
  # end
end
