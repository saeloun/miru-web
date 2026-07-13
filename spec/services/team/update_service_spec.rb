# frozen_string_literal: true

require "rails_helper"

RSpec.describe Team::UpdateService do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employment) { create(:employment, company:, user:) }
  let(:actor) { create(:user, current_workspace_id: company.id) }
  let(:actor_role) { :admin }
  let(:user_params) { { first_name: "Jane", last_name: "Smith" } }
  let(:new_role) { "admin" }

  describe "#process" do
    subject(:process) do
      described_class.new(
        actor:, user: employment.user, user_params:, current_company: company, new_role:).process
    end

    before { actor.add_role(actor_role, company) }

    it "updates the user's attributes" do
      expect { subject }.to change { employment.user.reload.first_name }.to("Jane").and change {
          employment.user.reload.last_name
        }.to("Smith")
    end

    it "updates the user's role" do
      expect { subject }.to change {
        employment.user.reload.primary_role(company)
      }.from("employee").to("admin")
    end

    context "with an unknown role" do
      let(:new_role) { "superhacker" }

      before { user.add_role(:employee, company) }

      it "rejects the role without changing the user or creating a role" do
        expect { process }.to raise_error(ActiveRecord::RecordInvalid)

        expect(user.reload.primary_role(company)).to eq("employee")
        expect(Role.where(name: "superhacker")).to be_empty
      end
    end

    context "when an admin changes their own role to owner" do
      let(:actor) { user }
      let(:new_role) { "owner" }

      it "rejects the role change" do
        expect { process }.to raise_error(Pundit::NotAuthorizedError)

        expect(user.reload.primary_role(company)).to eq("admin")
      end
    end

    context "when an owner assigns owner to another user" do
      let(:actor_role) { :owner }
      let(:new_role) { "owner" }

      before { user.add_role(:employee, company) }

      it "updates the user's role" do
        expect { process }.to change { user.reload.primary_role(company) }.from("employee").to("owner")
      end
    end

    context "when an admin demotes an existing owner" do
      let(:new_role) { "manager" }

      before { user.add_role(:owner, company) }

      it "rejects the role change" do
        expect { process }.to raise_error(Pundit::NotAuthorizedError)

        expect(user.reload.primary_role(company)).to eq("owner")
      end
    end

    context "when an owner demotes another owner" do
      let(:actor_role) { :owner }
      let(:new_role) { "manager" }

      before { user.add_role(:owner, company) }

      it "updates the user's role" do
        expect { process }.to change { user.reload.primary_role(company) }.from("owner").to("manager")
      end
    end

    context "when an admin changes an employee to manager" do
      let(:new_role) { "manager" }

      before { user.add_role(:employee, company) }

      it "updates the user's role" do
        expect { process }.to change { user.reload.primary_role(company) }.from("employee").to("manager")
      end
    end

    context "with the client role" do
      let(:new_role) { "client" }

      before { user.add_role(:employee, company) }

      it "updates the user's role" do
        expect { process }.to change { user.reload.primary_role(company) }.from("employee").to("client")
      end
    end

    context "when an admin updates their details without changing their role" do
      let(:actor) { user }

      it "updates the user's attributes" do
        expect { process }.to change { user.reload.first_name }.to("Jane")
        expect(user.reload.primary_role(company)).to eq("admin")
      end
    end
  end
end
