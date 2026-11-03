# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Settings - Razorpay account connection", type: :system, js: true do
  let(:company) { create(:india_company, name: "Synthetic Collections Co", base_currency: "INR") }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:provider) { company.payments_providers.find_by(name: "razorpay") }
  let(:console_errors) { [] }
  let(:allowed_console_status) { nil }

  before do
    stub_request(:get, %r{\Ahttps://api\.pwnedpasswords\.com/range/}).to_return(status: 200, body: "")
    create(:employment, company:, user: owner, resigned_at: nil)
    owner.add_role(:owner, company)
    stub_razorpay_oauth_env
    allow_any_instance_of(PaymentProviders::RazorpayOauthClient).to receive(:authorization_url) do |_client, state:|
      "/payments/razorpay/callback?state=#{state}&code=synthetic-code"
    end
    sign_in(owner)
    watch_console
  end

  after do
    expect(console_errors).to eq([])
  end

  def watch_console
    browser = page.driver.browser.page
    browser.command("Log.enable")
    browser.on("Runtime.consoleAPICalled") do |event|
      console_errors << event["args"].map { |arg| arg["value"] || arg["description"] }.join(" ") if event["type"] == "error"
    end
    browser.on("Log.entryAdded") do |event|
      entry = event["entry"]
      console_errors << "#{entry["text"]} #{entry["url"]}" if entry["level"] == "error" && !expected_console_noise?(entry)
    end
  end

  # Requests that the test deliberately fails (409 on a blocked save) and blocked external assets are not page defects.
  def expected_console_noise?(entry)
    (allowed_console_status && entry["text"].to_s.include?(allowed_console_status)) || entry["url"].to_s.exclude?("localhost")
  end

  def capture(name, path: "/settings/payment", selector: "[data-testid='razorpay-connection']")
    [[1400, 1000, "desktop"], [390, 844, "mobile"]].each do |width, height, label|
      page.driver.resize(width, height)
      with_forgery_protection { visit path }
      expect(page).to have_css(selector, wait: 15)
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
      expect(overflowing_controls(selector)).to eq([])
      save_shot(name, label, selector)
    end
    page.driver.resize(1400, 1000)
    with_forgery_protection { visit path }
    expect(page).to have_css(selector, wait: 15)
  end

  def overflowing_controls(selector)
    page.evaluate_script(<<~JS)
      (function() {
        var panel = document.querySelector(#{selector.to_json}).getBoundingClientRect();
        return Array.from(document.querySelectorAll(#{selector.to_json} + " button, " + #{selector.to_json} + " input"))
          .filter(function(control) {
            return control.getBoundingClientRect().right > panel.right || control.scrollWidth > control.clientWidth;
          })
          .map(function(control) { return control.textContent || control.id; });
      })()
    JS
  end

  def save_shot(name, label, selector = "[data-testid='razorpay-connection']")
    return if ENV["RZP_SHOTS"].blank?

    FileUtils.mkdir_p(ENV["RZP_SHOTS"])
    width, height = page.evaluate_script("[window.innerWidth, window.innerHeight]")
    page.driver.resize(width, page.evaluate_script("document.documentElement.scrollHeight"))
    sleep 0.5
    page.save_screenshot(File.join(ENV["RZP_SHOTS"], "#{name}-#{label}.png"), selector:)
    page.driver.resize(width, height)
  end

  def connection_panel
    find("[data-testid='razorpay-connection']", wait: 15)
  end

  def visit_settings
    with_forgery_protection { visit "/settings/payment" }
    connection_panel
  end

  def connected_provider
    created = create(:payments_provider, company:, name: "razorpay", settings: { platform_fee_percent: "0" })
    connect_razorpay_oauth(created, owner)
  end

  it "detects console errors, so the checks in this file can fail" do
    visit_settings
    page.execute_script("console.error('synthetic console probe')")
    expect(page).to have_css("[data-testid='razorpay-connection']")
    Timeout.timeout(5) { sleep 0.05 until console_errors.any? }
    expect(console_errors.join).to include("synthetic console probe")
    console_errors.clear
  end

  it "confirms an uncertain payment link without another creation or SMS" do
    connected = connected_provider
    PaymentProviders::RazorpayOauthConnection.new(provider: connected, actor: owner).update_collections!(enabled: true)
    invoice = create(:invoice, company:, client: create(:client, company:, currency: "INR"), currency: "INR",
      amount: 1000, amount_due: 1000, amount_paid: 0, status: "sent", payment_infos: {})
    links_url = "https://api.razorpay.com/v1/payment_links"
    creation = stub_request(:post, links_url).to_timeout
    expect { PaymentProviders::RazorpayPaymentLinkService.new(invoice:, provider: connected, callback_url: "https://example.test/return").process }
      .to raise_error(PaymentProviders::RazorpayClient::Error)
    reference = invoice.reload.payment_infos.dig("razorpay_link_creation", "reference_id")
    lookup = stub_request(:get, "#{links_url}/").with(query: { reference_id: reference })
      .to_return(status: 200, body: { payment_links: [] }.to_json, headers: { "Content-Type" => "application/json" })
    visit_settings
    within(connection_panel) do
      expect(page).to have_content("Payment links need confirmation")
      expect(page).to have_content(reference)
      expect(page).to have_content("acc_synthetic")
      expect(page).to have_field("Payment Link ID (optional)")
      click_button "Check Razorpay"
    end
    expect(page).to have_content("Payment link status refreshed.")
    expect(lookup).to have_been_requested.once
    expect(invoice.reload.payment_infos).to have_key("razorpay_link_creation")
    capture("14-link-needs-confirmation")
    stub_request(:get, "#{links_url}/plink_recovered").to_return(status: 200, body: {
      id: "plink_recovered", reference_id: reference, short_url: "https://rzp.io/rzp/recovered", status: "created",
      amount: 100_000, amount_paid: 0, currency: "INR", notes: { miru_invoice_id: invoice.id.to_s, company_id: company.id.to_s }
    }.to_json, headers: { "Content-Type" => "application/json" })
    within(connection_panel) do
      fill_in "Payment Link ID (optional)", with: "plink_recovered"
      click_button "Check Razorpay"
      expect(page).to have_no_content("Payment links need confirmation", wait: 10)
    end
    expect(invoice.reload.razorpay_payment_link_id).to eq("plink_recovered")
    expect(creation).to have_been_requested.once
    expect(a_request(:post, %r{/notify_by/})).not_to have_been_made
  end

  it "explains missing application credentials and keeps API keys usable" do
    stub_razorpay_oauth_env(ENABLED: "false")
    visit_settings
    within(connection_panel) do
      expect(page).to have_content("not switched on for this Miru installation")
      expect(page).to have_no_button("Connect or create Razorpay account")
    end
    expect(page).to have_css("#razorpay_key_secret", visible: :visible)
    capture("01-not-configured")
  end

  it "keeps a legacy API-key workspace unchanged and never offers connect" do
    legacy = create(:payments_provider, company:, name: "razorpay", connected: true,
      settings: { key_id: "rzp_test_synthetic", platform_fee_percent: "0" })
    legacy.key_secret = "synthetic-existing-secret"
    legacy.update!(enabled: true)
    visit_settings
    within(connection_panel) do
      expect(page).to have_content("uses Razorpay API keys")
      expect(page).to have_no_button("Connect or create Razorpay account")
    end
    expect(page).to have_field("razorpay_key_id", with: "rzp_test_synthetic")
    expect(page).to have_no_content("synthetic-existing-secret")
    capture("02-legacy-api-keys")
  end

  it "connects through the hosted flow, enables collection, and shows it on the public invoice" do
    stub_razorpay_token
    visit_settings
    within(connection_panel) do
      expect(page).to have_content("Razorpay hosts sign-in, sign-up and KYC")
      expect(page).to have_content("does not activate an account")
    end
    capture("03-connect-or-create")

    click_button "Connect or create Razorpay account"
    expect(page).to have_content("Razorpay account connected", wait: 15)
    expect(page).to have_current_path("/settings/payment", ignore_query: false, wait: 10)
    within(connection_panel) do
      expect(page).to have_content("Connected")
      expect(page).to have_content("acc_synthetic")
      expect(page).to have_content("does not include RazorpayX, Payroll or payouts")
      expect(page).to have_no_content("synthetic-access")
    end
    expect(page).to have_no_css("#razorpay_key_secret", visible: :visible)
    capture("04-connected")

    find("#razorpay_connection_collections").click
    expect(page).to have_css("#razorpay_connection_collections[aria-checked='true']", wait: 10)
    expect(provider.reload).to be_enabled.and be_razorpay_collectable

    invoice = create(:invoice, company:, client: create(:client, company:, currency: "INR"), currency: "INR", amount: 1000, amount_due: 1000,
      amount_paid: 0, status: "sent")
    with_forgery_protection { visit "/invoices/#{invoice.external_view_key}/view" }
    expect(page).to have_content(invoice.invoice_number, wait: 15)
    expect(page).to have_button("PAY", wait: 10)
    expect(page.evaluate_async_script(<<~JS, invoice.external_view_key)).to be(true)
      var done = arguments[arguments.length - 1];
      fetch("/api/v1/invoices/" + arguments[0] + "/view", { headers: { Accept: "application/json" } })
        .then(function(response) { return response.json(); })
        .then(function(body) { done(body.razorpay_payment.enabled); });
    JS
    capture("05-public-invoice-collecting", path: "/invoices/#{invoice.external_view_key}/view", selector: "#react-root")
  end

  it "shows a live merchant as not ready until Razorpay confirms it" do
    connected = connected_provider
    stub_razorpay_oauth_env(MODE: "live")
    connected.razorpay_oauth_credentials = connected.razorpay_oauth_credentials.merge("identity" => PaymentProviders::RazorpayOauthClient.new.identity)
    connected.settings["oauth_mode"] = "live"
    connected.save!
    visit_settings
    within(connection_panel) do
      expect(page).to have_content("Invoice collection is not available yet")
      expect(page).to have_content("Razorpay has not confirmed that this account can accept payments")
      expect(page).to have_css("#razorpay_connection_collections[disabled]")
    end
    capture("06-merchant-unconfirmed")
  end

  it "shows captured payments needing review and lets the owner clear them" do
    connected_provider
    invoice = create(:invoice, company:, client: create(:client, company:, currency: "INR"), currency: "INR", amount: 600, amount_due: 600,
      amount_paid: 0, status: "sent")
    PaymentProviders::RazorpayPaymentReview.flag!(invoice, payment_id: "pay_synthetic", payment_link_id: "plink_synthetic", amount: 100_000, reason: "webhook_mismatch", currency: "INR")
    visit_settings
    within(connection_panel) do
      expect(page).to have_content("Razorpay payments need your review")
      expect(page).to have_content("Invoice #{invoice.invoice_number}: INR 1000.00")
      expect(page).to have_content("Payment pay_synthetic, payment link plink_synthetic")
      expect(page).to have_content("Invoice is unpaid.")
    end
    capture("12-payment-needs-review")
    within(connection_panel) { click_button "Mark as reviewed" }
    expect(page).to have_content("Mark this payment as reviewed?")
    click_button "Keep in review"
    expect(PaymentProviders::RazorpayPaymentReview.pending?(invoice.reload)).to be(true)
    within(connection_panel) { click_button "Mark as reviewed" }
    click_button "Confirm reviewed"
    within(connection_panel) { expect(page).to have_no_content("Razorpay payments need your review", wait: 10) }
    expect(PaymentProviders::RazorpayPaymentReview.pending?(invoice.reload)).to be(false)
  end

  it "shows unknown captured money as unavailable instead of zero" do
    connected_provider
    invoice = create(:invoice, company:, client: create(:client, company:, currency: "INR"), currency: "INR", amount: 600, amount_due: 600,
      amount_paid: 0, status: "sent")
    PaymentProviders::RazorpayPaymentReview.flag!(invoice, payment_id: "pay_unknown", payment_link_id: "plink_synthetic", amount: nil, reason: "webhook_mismatch")
    visit_settings
    within(connection_panel) do
      expect(page).to have_content("Invoice #{invoice.invoice_number}: N/A")
      expect(page).to have_content("Payment pay_unknown, payment link plink_synthetic")
      expect(page).to have_no_content("INR 0")
    end
    capture("13-payment-unknown-amount")
  end

  it "explains when the review list is limited" do
    connected_provider
    invoice = create(:invoice, company:, client: create(:client, company:, currency: "INR"), currency: "INR", amount: 600, amount_due: 600,
      amount_paid: 0, status: "sent")
    21.times do |index|
      PaymentProviders::RazorpayPaymentReview.flag!(invoice, payment_id: "pay_#{index}", payment_link_id: "plink_synthetic", amount: 100,
        reason: "webhook_mismatch", currency: "INR")
    end
    visit_settings
    within(connection_panel) do
      expect(page).to have_css("li", count: 20)
      expect(page).to have_content("Showing the first 20 payments. Review these to see any remaining payments.")
    end
  end

  it "keeps recovery and revocation both reachable after an ambiguous refresh" do
    connected = connected_provider
    stub_razorpay_token(body: {}, status: 502)
    travel 2.hours do
      expect { PaymentProviders::RazorpayOauthConnection.new(provider: connected, actor: nil).access_token }
        .to raise_error(PaymentProviders::RazorpayOauthConnection::Error)
    end
    visit_settings
    within(connection_panel) do
      expect(page).to have_content("Recovery needed")
      expect(page).to have_button("Retry revocation")
      expect(page).to have_field("razorpay_recovery_account", with: "acc_synthetic")
    end
  end

  it "does not claim access revoked when disconnecting an interrupted refresh" do
    connected = connected_provider
    connected.update!(settings: connected.settings.merge("oauth_refresh_reservation" => "interrupted-worker",
      "oauth_refresh_reserved_at" => 2.minutes.ago.to_i))
    stub_request(:post, RazorpayOauthHelpers::REVOKE_URL).to_return(status: 200, body: { message: "Token Revoked" }.to_json)

    visit_settings
    within(connection_panel) { click_button "Disconnect Razorpay" }
    click_button "Disconnect", exact: true

    within(connection_panel) do
      expect(page).to have_content("Recovery needed", wait: 10)
      expect(page).to have_button("Start recovery")
      expect(page).to have_no_button("Connect or create Razorpay account")
    end
    expect(page).to have_no_content("Razorpay disconnected and access revoked")
    expect(connected.reload.settings["oauth_refresh_reservation"]).to be_nil
  end

  it "recovers an orphaned reservation through settings and signed revocation" do
    connected = connected_provider
    connected.update!(connected: false, settings: connected.settings.except("razorpay_oauth_credentials_ciphertext").merge(
      "oauth_refresh_reservation" => "interrupted-worker", "oauth_refresh_reserved_at" => 2.minutes.ago.to_i,
      "oauth_status" => "disconnected"))

    visit_settings
    within(connection_panel) do
      expect(page).to have_content("Recovery needed")
      expect(page).to have_no_button("Connect or create Razorpay account")
      click_button "Start recovery"
      expect(page).to have_content("Recovery in progress", wait: 10)
    end
    expect(page).to have_no_css("#razorpay_key_secret", visible: :visible)
    post_signed_revocation("acc_synthetic")
    within(connection_panel) do
      click_button "Check again"
      expect(page).to have_content("Access revoked", wait: 10)
      expect(page).to have_button("Connect or create Razorpay account")
    end
    expect(connected.reload.settings["oauth_refresh_reservation"]).to be_nil
  end

  it "disconnects after confirmation and offers reconnect" do
    connected_provider
    stub_request(:post, RazorpayOauthHelpers::REVOKE_URL).to_return(status: 200, body: { message: "Token Revoked" }.to_json)
    visit_settings
    within(connection_panel) { click_button "Disconnect Razorpay" }
    expect(page).to have_content("may still be able to pay with it")
    click_button "Disconnect", exact: true
    expect(page).to have_content("Razorpay disconnected and access revoked", wait: 10)
    within(connection_panel) { expect(page).to have_button("Connect or create Razorpay account") }
    expect(page).to have_css("#razorpay_key_secret", visible: :visible)
  end

  it "keeps failed revocation retryable from the page" do
    connected_provider
    stub_request(:post, RazorpayOauthHelpers::REVOKE_URL).to_return({ status: 503, body: "" }, { status: 200, body: { message: "Token Revoked" }.to_json })
    visit_settings
    within(connection_panel) { click_button "Disconnect Razorpay" }
    click_button "Disconnect", exact: true
    within(connection_panel) do
      expect(page).to have_content("Revocation pending", wait: 10)
      expect(page).to have_button("Retry revocation")
    end
    capture("08-revocation-pending")
    within(connection_panel) { click_button "Retry revocation" }
    click_button "Disconnect", exact: true
    expect(page).to have_content("Razorpay disconnected and access revoked", wait: 10)
  end

  it "walks an owner through recovery of an unknown grant without a console" do
    stub_request(:post, RazorpayOauthHelpers::TOKEN_URL).to_timeout
    visit_settings
    click_button "Connect or create Razorpay account"
    expect(page).to have_content("could not be completed", wait: 15)
    within(connection_panel) do
      expect(page).to have_content("Recovery needed")
      expect(page).to have_content("a grant may still exist")
      expect(page).to have_no_button("Connect or create Razorpay account")
    end
    capture("09-recovery-needed")

    within(connection_panel) do
      fill_in "razorpay_recovery_account", with: "acc_syntheticrecovery"
      click_button "Start recovery"
      expect(page).to have_content("Recovery in progress", wait: 10)
      expect(page).to have_content("open Applications and choose Revoke")
      expect(page).to have_no_button("Connect or create Razorpay account")
    end
    capture("10-recovery-in-progress")

    post_signed_revocation("acc_syntheticrecovery")
    within(connection_panel) do
      click_button "Check again"
      expect(page).to have_content("Access revoked", wait: 10)
      expect(page).to have_button("Connect or create Razorpay account")
    end
    capture("11-revoked-reconnect")
  end

  context "when a save is blocked" do
    let(:allowed_console_status) { "409" }

    it "makes a blocked API-key save actionable" do
      visit_settings
      fill_in "razorpay_key_id", with: "rzp_test_synthetic"
      create(:payments_provider, company:, name: "razorpay", settings: {
        platform_fee_percent: "0", authentication_mode: "oauth", oauth_status: "pending", oauth_state: { digest: "synthetic" }
      })
      click_button "Save Razorpay"
      expect(page).to have_content("Disconnect the Razorpay account connection before saving API keys", wait: 10)
      expect(page).to have_no_css("#razorpay_key_id", visible: :visible, wait: 10)
    end
  end

  def post_signed_revocation(account_id)
    PaymentProviders::RazorpayOauthWebhook.new(
      payload: (body = { event: "account.app.authorization_revoked", account_id:, created_at: 1.minute.from_now.to_i }.to_json),
      signature: OpenSSL::HMAC.hexdigest("SHA256", RazorpayOauthHelpers::WEBHOOK_SECRET, body),
      event_id: "evt_synthetic_recovery"
    ).process
  end
end
