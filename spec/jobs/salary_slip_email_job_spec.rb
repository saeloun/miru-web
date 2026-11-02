# frozen_string_literal: true

require "rails_helper"

RSpec.describe SalarySlipEmailJob do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }
  let!(:admin_employment) { create(:employment, company:, user: admin, resigned_at: nil) }
  let!(:employment) { create(:employment, company:, user: employee, resigned_at: nil) }
  let(:slip) do
    employment.salary_slips.create!(uploaded_by: admin, source: "Approved provider", pay_month: "2026-09-01",
      published_at: Time.current,
      file: { io: File.open(Rails.root.join("spec/support/fixtures/pdf-file.pdf")),
              filename: "approved.pdf", content_type: "application/pdf" })
  end
  let(:delivery) { instance_double(ActionMailer::MessageDelivery, deliver_now: true) }

  before do
    admin.add_role(:admin, company)
    employee.add_role(:employee, company)
    allow(SalarySlipMailer).to receive_message_chain(:with, :published).and_return(delivery)
  end

  def perform
    described_class.perform_now(slip.id, admin.id, company.id, employee.email)
  end

  it "delivers once within five minutes and records metadata only" do
    2.times { perform }
    expect(delivery).to have_received(:deliver_now).once
    expect(slip.audits.where(action: "email").sole.audited_changes).to eq("recipient_user_id" => employee.id)
    travel 6.minutes
    perform
    expect(delivery).to have_received(:deliver_now).twice
  end

  [:email, :withdrawn, :discarded, :admin_role, :admin_membership, :recipient_role,
   :unconfirmed, :future, :resigned].each do |revocation|
    it "discards sends after #{revocation} changes" do
      original_email = employee.email
      slip
      case revocation
      when :email then employee.update_columns(email: "changed@example.test")
      when :withdrawn then slip.withdraw!(actor: admin)
      when :discarded then employment.update_columns(discarded_at: Time.current)
      when :admin_role then admin.remove_role(:admin, company)
      when :admin_membership then admin_employment.update_columns(discarded_at: Time.current)
      when :recipient_role then employee.remove_role(:employee, company)
      when :unconfirmed then employee.update_columns(confirmed_at: nil)
      when :future then employment.update_columns(joined_at: Date.tomorrow)
      when :resigned then employment.update_columns(resigned_at: Date.yesterday)
      end
      described_class.perform_now(slip.id, admin.id, company.id, original_email)
      expect(delivery).not_to have_received(:deliver_now)
      expect(slip.audits.where(action: "email")).not_to exist
    end
  end

  it "keeps the captured workspace when the actor changes their default before execution" do
    admin.update_columns(current_workspace_id: create(:company).id)
    perform
    expect(delivery).to have_received(:deliver_now).once
  end

  it "propagates provider failure without recording a successful send" do
    allow(delivery).to receive(:deliver_now).and_raise(IOError, "provider unavailable")
    expect { perform }.to raise_error(IOError, "provider unavailable")
    expect(slip.audits.where(action: "email")).not_to exist
  end
end
