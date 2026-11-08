# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Mobile connected-account collection creation", type: :request do
  let(:company) { create(:india_company, base_currency: "INR", plan_tier: "paid") }
  let(:owner) { create(:user, current_workspace: company) }
  let(:provider) { create(:payments_provider, company:, name: "razorpay", settings: { platform_fee_percent: "0", sms_notifications_enabled: true }) }
  let(:links_url) { "https://api.razorpay.com/v1/payment_links" }
  let(:creation_sms) { [] }
  let(:payload) do
    { collection: { name: "Synthetic Customer", phone: "9876543210", amount: "1500", create_payment_link: true,
      notify_sms: true, idempotency_key: "synthetic-collection" } }
  end

  around do |example|
    VCR.turned_off do
      WebMock.disable_net_connect!
      example.run
    end
  end

  prepend_before do
    stub_request(:get, %r{\Ahttps://api\.pwnedpasswords\.com/range/}).to_return(status: 200, body: "")
  end

  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
    create(:employment, company:, user: owner, resigned_at: nil)
    owner.add_role(:owner, company)
    stub_razorpay_oauth_env
    connect_razorpay_oauth(provider, owner)
    PaymentProviders::RazorpayOauthConnection.new(provider:, actor: owner).update_collections!(enabled: true)
    sign_in owner
    @threads = []
  end

  after do
    @threads.each { |thread| thread.kill if thread.alive? }
    @threads.each(&:join)
  end

  def create_collection(body = payload)
    post "/api/v1/mobile/collections", params: body, headers: auth_headers(owner)
  end

  def stub_creation
    bank_link = nil
    creation = stub_request(:post, links_url).to_return do |request|
      body = JSON.parse(request.body)
      creation_sms << body.dig("notify", "sms")
      bank_link = body.slice("reference_id", "notes", "amount", "currency").merge(
        "id" => "plink_mobile", "short_url" => "https://rzp.io/rzp/mobile", "status" => "created", "amount_paid" => 0)
      { status: 200, body: bank_link.to_json, headers: { "Content-Type" => "application/json" } }
    end
    stub_request(:get, "#{links_url}/plink_mobile").to_return do
      { status: 200, body: bank_link.to_json, headers: { "Content-Type" => "application/json" } }
    end
    creation
  end

  [nil, "", "x" * 101].each do |key|
    it "rejects an absent or invalid key before saving a collection: #{key.inspect}" do
      creation = stub_request(:post, links_url).to_timeout
      body = payload.deep_dup
      body[:collection][:idempotency_key] = key
      expect { create_collection(body) }.not_to change(Invoice, :count)
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to include("code" => "idempotency_key_required")
      expect(creation).not_to have_been_requested
    end
  end

  it "returns the saved invoice and a safe recovery instruction after an uncertain creation" do
    creation = stub_request(:post, links_url).to_timeout
    create_collection
    invoice = company.invoices.last
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body).to include("code" => "razorpay_link_unconfirmed", "invoice" => hash_including("id" => invoice.id))
    expect(response.parsed_body["error"]).to include("Do not create another collection", "owner or admin")
    reference = invoice.payment_infos.dig("razorpay_link_creation", "reference_id")
    stub_request(:get, "#{links_url}/").with(query: { reference_id: reference })
      .to_return(status: 200, body: { payment_links: [] }.to_json, headers: { "Content-Type" => "application/json" })
    expect { create_collection }.not_to change(Invoice, :count)
    expect(response.parsed_body.dig("invoice", "id")).to eq(invoice.id)
    expect(creation).to have_been_requested.once
  end

  it "does not resend an SMS when the same collection request is replayed" do
    creation = stub_creation
    notification = stub_request(:post, "#{links_url}/plink_mobile/notify_by/sms")
      .to_return(status: 200, body: "{}", headers: { "Content-Type" => "application/json" })
    create_collection
    expect(response).to have_http_status(:accepted)
    expect(response.parsed_body["sms_sent"]).to be(true)
    expect { create_collection }.not_to change(Invoice, :count)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["sms_sent"]).to be(false)
    expect(creation).to have_been_requested.once
    expect(notification).not_to have_been_requested
  end

  it "serializes concurrent collection retries before either creates another invoice" do
    create_collection(collection: { name: "Synthetic Customer", phone: "9876543210" })
    expect(response).to have_http_status(:created)
    entered, release, before_api, second_finished = Queue.new, Queue.new, Queue.new, Queue.new
    calls = 0
    allow_any_instance_of(Api::V1::Mobile::CollectionsController).to receive(:create_invoice!).and_wrap_original do |original, *args|
      calls += 1
      if calls == 1
        entered << true
        release.pop
      end
      original.call(*args)
    end
    creation = stub_creation
    notifications = []
    stub_request(:post, "#{links_url}/plink_mobile/notify_by/sms").to_return do
      notifications << true
      { status: 200, body: "{}", headers: { "Content-Type" => "application/json" } }
    end
    allow_any_instance_of(Api::V1::Mobile::CollectionsController).to receive(:create_razorpay_payment_link!).and_wrap_original do |original, *args, **keywords|
      if Thread.current[:miru_mobile_first]
        before_api << true
        second_finished.pop
      end
      original.call(*args, **keywords)
    end
    stub_request(:get, %r{\Ahttps://api\.razorpay\.com/v1/payment_links/\?reference_id=miru-[a-f0-9]{32}\z}).to_return do
      invoice = company.invoices.last
      reference = invoice.payment_infos.dig("razorpay_link_creation", "reference_id") || invoice.razorpay_payment_link_reference_id
      { status: 200, body: { payment_links: [{ id: "plink_mobile", reference_id: reference }] }.to_json, headers: { "Content-Type" => "application/json" } }
    end
    request_body, request_headers = payload.deep_dup, auth_headers(owner)
    start_request = lambda do |label|
      @threads << Thread.new do
        Thread.current.report_on_exception = false
        ActiveRecord::Base.connection_pool.with_connection do |database|
          database.execute("SET application_name = #{database.quote(label)}")
          Thread.current[:miru_mobile_first] = label == "miru_mobile_first"
          session = ActionDispatch::Integration::Session.new(Rails.application)
          session.post("/api/v1/mobile/collections", params: request_body, headers: request_headers)
          [session.response.status, session.response.parsed_body]
        ensure
          database.execute("RESET application_name")
          Thread.current[:miru_mobile_first] = nil
        end
      end
      @threads.last
    end
    first = start_request.call("miru_mobile_first")
    Timeout.timeout(5) { entered.pop }
    second = start_request.call("miru_mobile_second")
    Timeout.timeout(5) do
      loop do
        break if ActiveRecord::Base.connection.select_value("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name = 'miru_mobile_second' AND wait_event_type = 'Lock')")

        Thread.pass
      end
    end
    release << true
    Timeout.timeout(5) { before_api.pop }
    second_result = Timeout.timeout(5) { second.value }
    second_finished << true
    results = Timeout.timeout(5) { [first.value, second_result] }
    expect(results.map(&:first)).to all(be_between(200, 202))
    expect(results.map { |result| result.last.dig("invoice", "id") }.uniq).to eq([company.invoices.last.id])
    expect(company.invoices.count).to eq(1)
    expect(creation).to have_been_requested.once
    expect(calls).to eq(1)
    expect(creation_sms.count(true) + notifications.size).to eq(1)
  ensure
    release << true
    second_finished << true
  end
end
