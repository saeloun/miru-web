# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompanyPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  subject { described_class }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
    end

    permissions :new?, :create?, :show?, :update? do
      it "is permitted to access company" do
        expect(subject).to permit(user, company)
      end
    end

    permissions :company_present? do
      it "is permitted to access app" do
        expect(subject).to permit(user, company)
      end

      it "is not permitted to access app when current workspace is not present" do
        user.update(current_workspace_id: nil)

        expect(subject).not_to permit(user, nil)
      end
    end

    permissions :users? do
      it "is permitted to get company users list" do
        expect(subject).to permit(user, Project)
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
    end

    permissions :show?, :update? do
      it "is not permitted to access company" do
        expect(subject).not_to permit(user, company)
      end
    end

    permissions :new?, :create? do
      it "is permitted to access company" do
        expect(subject).to permit(user, company)
      end
    end

    permissions :company_present? do
      it "is permitted to access app" do
        expect(subject).to permit(user, company)
      end

      it "is not permitted to access app when current workspace is not present" do
        user.update(current_workspace_id: nil)

        expect(subject).not_to permit(user, nil)
      end
    end

    permissions :users? do
      it "is not permitted to get company users list" do
        expect(subject).not_to permit(user, Project)
      end
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
    end

    permissions :new?, :create? do
      it "is permitted to access company" do
        expect(subject).to permit(user, company)
      end
    end

    permissions :show?, :update? do
      it "is not permitted to access company" do
        expect(subject).not_to permit(user, company)
      end
    end

    permissions :company_present? do
      it "is permitted to access app" do
        expect(subject).to permit(user, company)
      end

      it "is not permitted to access app when current workspace is not present" do
        user.update(current_workspace_id: nil)

        expect(subject).not_to permit(user, nil)
      end
    end

    permissions :users? do
      it "is not permitted to get company users list" do
        expect(subject).not_to permit(user, Project)
      end
    end
  end

  describe "#permitted_attributes" do
    subject { described_class.new(user, company).permitted_attributes }

    let(:addresses_attributes) do
      %i[id address_line_1 address_line_2 city state country pin]
    end

    let(:attributes) do
      %i[
        name business_phone country timezone base_currency standard_price
        fiscal_year_end logo date_format working_days working_hours
      ].push(addresses_attributes:)
    end

    it "returns array of an attributes" do
      expect(subject).to match_array(attributes)
    end
  end
end
