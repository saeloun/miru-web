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

    context "when more than one employments are present for user" do
      before do
        create(:employment, user:, company: create(:company))
      end

      it "sets next employment as default employment" do
        user.reload
        expect(user.employments.kept.count).to eq 2
        employment.discard!
        expect(user.employments.kept.count).to eq 1
        expect(user.current_workspace_id).not_to eq company.id
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
