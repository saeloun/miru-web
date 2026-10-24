# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Private document review invitations", type: :mailer do
  let(:company) { create(:company) }
  let(:admin) { create(:user) }
  let(:invitation) do
    file = Rack::Test::UploadedFile.new(Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf"), "application/pdf")
    upload = Signatures::Upload.new([ActionDispatch::Http::UploadedFile.new(
      tempfile: file.tempfile, filename: "qa-main.pdf", type: "application/pdf")])
    upload.with_cleanup do
      record = SignatureRequest.create!(company:, created_by: admin, title: "Private compensation terms",
        creation_key: SecureRandom.uuid, creation_digest: "a" * 64)
      revision = record.revise!(actor: admin, upload:, attributes: { recipients: [
        { "id" => "reviewer", "name" => "Synthetic Reviewer", "email" => "reviewer@example.test", "role" => "reviewer" }
      ] })
      revision.review_invitations.create!(invited_by: admin, recipient_id: "reviewer", expires_at: 7.days.from_now)
    end
  end

  it "sends only to the frozen recipient and puts the capability in a URL fragment" do
    mail = SignatureReviewMailer.invite(invitation.id).deliver_now
    expect(mail.to).to eq(["reviewer@example.test"])
    link = Nokogiri::HTML(mail.html_part.body.decoded).at_css("a[data-review-link]")["href"]
    uri = URI.parse(link)
    expect(uri.path).to eq("/document-review")
    expect(uri.query).to be_nil
    expect(uri.fragment).to eq(invitation.access_token)
    expect(mail.subject).not_to include("Private compensation terms")
    expect(invitation.reload.email_status).to eq("sent")
    expect(invitation.email_sent_at).to be_present
  end

  it "does not mail an expired, revoked or superseded capability" do
    invitation.update!(revoked_at: Time.current)
    expect { SignatureReviewMailer.invite(invitation.id).deliver_now }.not_to change(ActionMailer::Base.deliveries, :size)
    invitation.update!(revoked_at: nil, expires_at: 1.second.ago)
    expect { SignatureReviewMailer.invite(invitation.id).deliver_now }.not_to change(ActionMailer::Base.deliveries, :size)
    invitation.update!(expires_at: 7.days.from_now)
    record = invitation.revision.signature_request
    record.with_lock { record.revise!(actor: admin, attributes: { title: "Replacement terms" }) }
    expect { SignatureReviewMailer.invite(invitation.id).deliver_now }.not_to change(ActionMailer::Base.deliveries, :size)
  end

  it "keeps capability and private email out of delivery instrumentation, including failures" do
    token = invitation.access_token
    events = []
    subscriber = ->(*args) { events << args.last.inspect }
    ActiveSupport::Notifications.subscribed(subscriber, "deliver.action_mailer") do
      SignatureReviewMailer.invite(invitation.id).deliver_now
      allow_any_instance_of(Mail::TestMailer).to receive(:deliver!).and_raise(StandardError, "Provider rejected #{token}")
      expect { SignatureReviewMailer.invite(invitation.id).deliver_now }
        .to raise_error(SignatureReviewMailer::DeliveryFailure, /could not be sent/)
    end
    expect(events.join).not_to include(token, "reviewer@example.test", "Private compensation terms")
    expect(invitation.reload.email_status).to eq("failed")
  end

  it "records a completed delivery when the version is replaced while SMTP is sending" do
    allow_any_instance_of(Mail::TestMailer).to receive(:deliver!).and_wrap_original do |method, *arguments|
      record = invitation.revision.signature_request
      record.with_lock { record.revise!(actor: admin, attributes: { title: "Replaced during delivery" }) }
      method.call(*arguments)
    end
    mail = SignatureReviewMailer.invite(invitation.id).deliver_now
    expect(mail.to).to eq(["reviewer@example.test"])
    expect(invitation.reload).to have_attributes(email_status: "sent")
    expect(invitation).not_to be_active
  end
end
