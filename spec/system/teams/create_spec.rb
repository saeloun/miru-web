# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Inviting team memeber", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    context "when inviting team memeber" do
      before do
        with_forgery_protection do
          visit "/teams"

          click_on "NEW USER"
          fill_in "First Name", with: "John"
          fill_in "Last Name", with: "Doe"
          fill_in "email", with: "john@example.com"
          choose "Employee"
          click_button "SEND INVITE"
        end
      end

      it "with valid inputs" do
        expect(page).to have_content("John Doe")
        expect(page).to have_content("Pending Invitation")
      end

      it "sends an invitation mail to the user" do
        perform_enqueued_jobs
        expect(ActiveJob::Base.queue_adapter.performed_jobs.last["job_class"]).to eq("ActionMailer::MailDeliveryJob")
        expect(ActionMailer::Base.deliveries.last.to).to include("john@example.com")
        expect(ActionMailer::Base.deliveries.last.subject).to eq("Welcome to Miru!")
        expect(ActionMailer::Base.deliveries.last.body).to include("click here")
        expect(ActionMailer::Base.deliveries.last.body).to include("to accept the invitation")
      end
    end
  end
end
