# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::SupportRequests", type: :request do
  let(:company) { create(:company, plan_tier: "paid") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:params) { { support_request: { subject: "Need help", message: "Please help with billing." } } }
  let(:cache) { ActiveSupport::Cache::MemoryStore.new }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
    sign_in user
    allow(Rails).to receive(:cache).and_return(cache)
    ActionMailer::Base.deliveries.clear
  end

  it "enqueues and sends a priority request for a Pro workspace" do
    expect {
      post api_v1_support_requests_path, params: params
    }.to have_enqueued_mail(SupportRequestMailer, :request)

    expect(response).to have_http_status(:created)

    perform_enqueued_jobs
    expect(ActionMailer::Base.deliveries.last.subject).to eq("[Priority] Need help")
  end

  it "sends a standard request for a workspace without Pro access" do
    company.update!(plan_tier: "free")

    post api_v1_support_requests_path, params: params
    perform_enqueued_jobs

    expect(response).to have_http_status(:created)
    expect(ActionMailer::Base.deliveries.last.subject).to eq("[Support] Need help")
  end

  it "removes injected mail headers from the subject" do
    post api_v1_support_requests_path, params: {
      support_request: {
        subject: "evil\r\nBcc: attacker@example.com",
        message: "Please help.\r\nBcc: attacker@example.com"
      }
    }
    perform_enqueued_jobs
    mail = ActionMailer::Base.deliveries.last

    expect(mail.header.fields.count { |field| field.name == "Subject" }).to eq(1)
    expect(mail.subject).to eq("[Priority] evilBcc: attacker@example.com")
    expect(mail.bcc).to be_nil
  end

  it "returns 429 after five requests in an hour" do
    5.times { post api_v1_support_requests_path, params: params }
    post api_v1_support_requests_path, params: params

    expect(response).to have_http_status(:too_many_requests)
    expect(json_response["errors"]).to eq("You can send up to 5 support requests per hour.")
  end
end
