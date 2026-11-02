# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmployeeOccasionMailer, type: :mailer do
  let(:company) { Company.new(id: 123, name: "Synthetic Workspace") }
  let(:employee) { User.new(id: 456, first_name: "Alex", last_name: "<Example>", date_of_birth: Date.new(1990, 1, 3)) }
  let(:admin) { User.new(email: "admin@example.test") }
  let(:employment) { Employment.new(company:, user: employee, joined_at: Date.new(2020, 1, 3)) }
  let(:message) { described_class.reminder(employment:, admin:, kind: "birthday", event_on: Date.new(2027, 1, 3)) }

  it "renders escaped HTML and plain text without birth year and with the guarded private-profile link" do
    expect(message.to).to eq([admin.email])
    expect(message.html_part.body.decoded).to include("&lt;Example&gt;", "January 3")
    expect(message.text_part.body.decoded).to include("Alex <Example>", "January 3")
    [message.html_part, message.text_part].each do |part|
      expect(part.body.decoded).to include("/team/456/employee-records?company_id=123")
      expect(part.body.decoded).not_to include("1990")
    end
  end

  it "propagates delivery failures including the normally rescued inactive-recipient error" do
    allow_any_instance_of(Mail::Message).to receive(:deliver).and_raise(Postmark::InactiveRecipientError, "Synthetic failure")
    expect { message.deliver_now }.to raise_error(Postmark::InactiveRecipientError)
  end
end
