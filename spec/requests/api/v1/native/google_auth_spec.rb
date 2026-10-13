# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Native Google authentication", type: :request do
  let(:verifier) { SecureRandom.urlsafe_base64(32) }
  let(:challenge) { Base64.urlsafe_encode64(Digest::SHA256.digest(verifier), padding: false) }
  let(:state) { SecureRandom.hex(32) }
  let(:company) { create(:company) }
  let(:user) { create(:user, email: "native-google@example.invalid", current_workspace: company) }
  let(:auth) do
    OmniAuth::AuthHash.new(provider: "google_oauth2", uid: "native-google-subject",
      info: { email: user.email, email_verified: true, first_name: "Native", last_name: "Tester" })
  end

  before do
    https!
    host! "app.miru.so"
    allow(HubspotIntegrationJob).to receive(:perform_later)
    stub_request(:get, %r{\Ahttps://api\.pwnedpasswords\.com/range/}).to_return(status: 200, body: "")
  end

  after do
    OmniAuth.config.mock_auth[:google_oauth2] = nil
    OmniAuth.config.mock_auth[:github] = nil
  end

  def start_request(intent: "login", **extra)
    post "/api/v1/native/auth/google/requests", params: {
      platform: "ios", intent:, code_challenge_method: "S256", code_challenge: challenge, state:
    }.merge(extra), as: :json
    response.parsed_body
  end

  def browser_callback(started, identity = auth)
    get started.fetch("authorization_url")
    csrf = Nokogiri::HTML(response.body).at_css('input[name="authenticity_token"]')&.[]("value")
    OmniAuth.config.mock_auth[:google_oauth2] = identity
    post user_google_oauth2_omniauth_authorize_path, params: { authenticity_token: csrf }
    4.times do
      break unless response.redirect?
      uri = URI.parse(response.location)
      break if uri.scheme == "miru-native-ios"
      follow_redirect!
    end
    URI.decode_www_form(URI.parse(response.location).query.to_s).to_h
  end

  def exchange(started, callback, **extra)
    post "/api/v1/native/auth/google/exchanges", params: {
      request_id: started.fetch("request_id"), code: callback.fetch("code"), code_verifier: verifier
    }.merge(extra), as: :json
    response.parsed_body
  end

  def grant_membership
    create(:employment, company:, user:)
    user.add_role :employee, company
  end

  it "starts an HTTPS system-browser request without credentials" do
    started = start_request
    expect(response).to have_http_status(:created)
    expect(started.keys).to match_array(%w[request_id authorization_url expires_at])
    expect(started["authorization_url"]).to eq("https://app.miru.so/native/auth/google/#{started.fetch('request_id')}")
    expect(response.headers["Cache-Control"]).to include("no-store")
  end

  it "rejects client redirects, other platforms, roles and foreign workspace parameters" do
    [{ redirect_uri: "https://evil.invalid" }, { platform: "android" },
     { role: "owner" }, { company_id: 123 }, { code_challenge_method: "plain" }].each do |bad|
      start_request(**bad)
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to eq("invalid_request")
    end
    expect(NativeGoogleAuthRequest.count).to eq(0)
  end

  it "rejects cross-origin start and exchange requests" do
    ["/api/v1/native/auth/google/requests", "/api/v1/native/auth/google/exchanges"].each do |path|
      post path, params: {}, headers: { "Origin" => "https://evil.invalid" }, as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end

  it "uses one-use PKCE callback codes and preserves the selected workspace and mobile headers" do
    grant_membership
    started = start_request
    callback = browser_callback(started)
    expect(response.location).to start_with("miru-native-ios://auth/google?")
    expect(callback.keys).to match_array(%w[request_id state code])
    expect(callback["request_id"]).to eq(started["request_id"])
    expect(callback["state"]).to eq(state)
    expect(response.location).not_to include(user.token, user.email)
    payload = exchange(started, callback)
    expect(payload["status"]).to eq("signed_in")
    expect(payload.dig("user", "token")).to eq(user.token)
    expect(payload.dig("company", "id")).to eq(company.id)
    expect(payload["company_role"]).to eq("employee")
    expect(user.reload.current_workspace_id).to eq(company.id)
    get "/api/v1/users/_me", headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    exchange(started, callback)
    expect(response.parsed_body["error"]).to eq("invalid_handoff")
  end

  it "does not create a new user for login-only requests" do
    identity = OmniAuth::AuthHash.new(provider: "google_oauth2", uid: "unknown-native-subject",
      info: { email: "unknown-native@example.invalid", email_verified: true, first_name: "Unknown", last_name: "Tester" })
    started = start_request
    before_count = User.count
    callback = browser_callback(started, identity)
    expect(callback["error"]).to eq("signup_required")
    expect(User.count).to eq(before_count)
  end

  it "creates a verified Google signup but returns onboarding without an API token" do
    started = start_request(intent: "signup")
    identity = OmniAuth::AuthHash.new(provider: "google_oauth2", uid: "new-native-subject",
      info: { email: "new-native@example.invalid", email_verified: true, first_name: "New", last_name: "Tester" })
    callback = browser_callback(started, identity)
    payload = exchange(started, callback)
    expect(payload["status"]).to eq("needs_workspace")
    expect(payload["continuation_url"]).to eq("https://app.miru.so/")
    expect(payload).not_to have_key("user")
    expect(payload).not_to have_key("token")
    expect(User.find_by!(email: "new-native@example.invalid")).to be_confirmed
  end

  it "rejects unverified Google emails without linking or creating identities" do
    grant_membership
    auth.info.email_verified = false
    callback = browser_callback(start_request)
    expect(callback["error"]).to eq("invalid_identity")
    expect(user.identities.google_auth).to be_empty
  end

  it "rejects string verification flags and subject ownership conflicts" do
    grant_membership
    auth.info.email_verified = "true"
    expect(browser_callback(start_request)["error"]).to eq("invalid_identity")
    auth.info.email_verified = true
    create(:identity, user: create(:user), provider: "google_oauth2", uid: auth.uid)
    expect(browser_callback(start_request)["error"]).to eq("identity_conflict")
    expect(user.identities.google_auth).to be_empty
  end

  it "authenticates an existing linked Google identity without duplicating it" do
    grant_membership
    create(:identity, user:, provider: "google_oauth2", uid: auth.uid)
    started = start_request
    callback = browser_callback(started)
    expect(exchange(started, callback)["status"]).to eq("signed_in")
    expect(user.identities.google_auth.count).to eq(1)
  end

  it "rejects an unconfirmed existing email instead of silently linking it" do
    user.update_columns(confirmed_at: nil)
    callback = browser_callback(start_request)
    expect(callback["error"]).to eq("account_unavailable")
    expect(user.identities.google_auth).to be_empty
  end

  it "does not replace an existing different Google subject" do
    grant_membership
    create(:identity, user:, provider: "google_oauth2", uid: "other-subject")
    callback = browser_callback(start_request)
    expect(callback["error"]).to eq("identity_conflict")
    expect(user.identities.google_auth.pluck(:uid)).to eq(["other-subject"])
  end

  it "returns additional verification without a token or new identity for TOTP and passkey accounts" do
    [[:otp_required_for_login, true], [:passkey_required_for_login, true]].each do |attribute, value|
      user.update!(attribute => value)
      started = start_request
      callback = browser_callback(started)
      payload = exchange(started, callback)
      expect(payload["status"]).to eq("additional_verification_required")
      expect(payload["continuation_url"]).to eq("https://app.miru.so/")
      expect(payload.keys).to match_array(%w[status continuation_url notice])
      expect(user.identities.google_auth).to be_empty
      user.update!(attribute => false)
    end
  end

  it "preserves SSO domain restrictions" do
    grant_membership
    company.update!(allowed_sso_domains: ["saeloun.com"])
    callback = browser_callback(start_request)
    expect(callback["error"]).to eq("sso_not_allowed")
    expect(user.identities.google_auth).to be_empty
  end

  it "uses Google as the existing SSO method without bypassing role or domain policy" do
    grant_membership
    company.update!(sso_enforced: true, allowed_sso_domains: ["example.invalid"])
    started = start_request
    callback = browser_callback(started)
    expect(exchange(started, callback)["status"]).to eq("signed_in")
  end

  it "rejects a kept membership without an assigned role" do
    create(:employment, company:, user:)
    expect(browser_callback(start_request)["error"]).to eq("workspace_unavailable")
    expect(user.identities.google_auth).to be_empty
  end

  it "preserves an unrelated existing web browser session" do
    grant_membership
    web_user = create(:user)
    sign_in web_user
    started = start_request
    callback = browser_callback(started)
    expect(exchange(started, callback).dig("user", "id")).to eq(user.id)
    get "/api/v1/users/_me"
    expect(response.parsed_body.dig("user", "id")).to eq(web_user.id)
  end

  it "accepts only the verified invitation recipient and existing invited role" do
    invitation = create(:invitation, company:, recipient_email: user.email, role: "employee")
    started = start_request(invitation_token: invitation.token)
    callback = browser_callback(started)
    payload = exchange(started, callback)
    expect(payload["status"]).to eq("signed_in")
    expect(payload["company_role"]).to eq("employee")
    expect(payload.dig("company", "id")).to eq(invitation.company_id)
    expect(invitation.reload.accepted_at).to be_present
    expect(user.reload.employed_at?(company.id)).to be(true)
    expect(user.has_role?(:owner, company)).to be(false)
  end

  it "does not accept an invitation for a different recipient" do
    invitation = create(:invitation, company:, recipient_email: "someone-else@example.invalid")
    callback = browser_callback(start_request(invitation_token: invitation.token))
    expect(callback["error"]).to eq("invitation_unavailable")
    expect(invitation.reload.accepted_at).to be_nil
    expect(user.employments.kept).to be_empty
  end

  it "rechecks invitation expiry at callback and rolls back seat-limit failures" do
    invitation = create(:invitation, company:, recipient_email: user.email)
    started = start_request(invitation_token: invitation.token)
    invitation.update_columns(expired_at: 1.second.ago)
    expect(browser_callback(started)["error"]).to eq("invitation_unavailable")
    expect(invitation.reload.accepted_at).to be_nil

    invitation.update_columns(expired_at: 1.hour.from_now)
    started = start_request(invitation_token: invitation.token)
    allow_any_instance_of(Company).to receive(:can_add_team_member_role?).and_return(false)
    expect(browser_callback(started)["error"]).to eq("invitation_unavailable")
    expect(invitation.reload.accepted_at).to be_nil
    expect(user.identities.google_auth).to be_empty
  end

  it "does not accept invitations or add identities before MFA verification" do
    invitation = create(:invitation, company:, recipient_email: user.email)
    user.update!(otp_required_for_login: true)
    started = start_request(invitation_token: invitation.token)
    callback = browser_callback(started)
    expect(exchange(started, callback)["status"]).to eq("additional_verification_required")
    expect(invitation.reload.accepted_at).to be_nil
    expect(user.identities.google_auth).to be_empty
  end

  it "rolls back an invitation whose target workspace disallows the verified email domain" do
    grant_membership
    target = create(:company, allowed_sso_domains: ["saeloun.com"])
    invitation = create(:invitation, company: target, recipient_email: user.email, role: "employee")
    callback = browser_callback(start_request(invitation_token: invitation.token))
    expect(callback["error"]).to eq("sso_not_allowed")
    expect(invitation.reload.accepted_at).to be_nil
    expect(user.reload.current_workspace_id).to eq(company.id)
    expect(user.employments.where(company: target)).to be_empty
    expect(user.roles.where(resource: target)).to be_empty
    expect(user.identities.google_auth).to be_empty
  end

  it "rolls back a new signup and its invitation when the target workspace rejects its domain" do
    target = create(:company, allowed_sso_domains: ["saeloun.com"])
    invitation = create(:invitation, company: target, recipient_email: "blocked-signup@example.invalid")
    identity = OmniAuth::AuthHash.new(provider: "google_oauth2", uid: "blocked-native-subject",
      info: { email: invitation.recipient_email, email_verified: true, first_name: "Blocked", last_name: "Signup" })
    started = start_request(intent: "signup", invitation_token: invitation.token)
    counts = [User.count, Employment.count, Identity.count]
    expect(browser_callback(started, identity)["error"]).to eq("sso_not_allowed")
    expect([User.count, Employment.count, Identity.count]).to eq(counts)
    expect(invitation.reload.accepted_at).to be_nil
  end

  it "redacts native broker and callback secrets in actual Rails logs without changing routing" do
    require "console/output/serialized"
    output = StringIO.new
    logger = ActiveSupport::Logger.new(output)
    allow(Rails).to receive(:logger).and_return(logger)
    allow(ActionController::Base).to receive(:logger).and_return(logger)
    previous_console = Console.logger
    Console.logger = Console::Logger.new(Console::Output::Serialized.new(output))
    subscriber = ActiveSupport::Notifications.subscribe("redirect_to.action_controller") do |event|
      ActionController::LogSubscriber.new.redirect_to(event)
    end
    grant_membership
    started = start_request
    callback = browser_callback(started)
    expect(callback.fetch("request_id")).to eq(started.fetch("request_id"))
    expect(callback.fetch("state")).to eq(state)
    expect(callback.fetch("code")).to match(/\A[0-9a-f]{64}\z/)
    expect(exchange(started, callback)["status"]).to eq("signed_in")
    logged = output.string
    expect(logged).to include("/native/auth/google/[FILTERED]", "miru-native-ios://auth/google?[FILTERED]")
    expect(logged).not_to include(started.fetch("request_id"), callback.fetch("code"), state)
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
    Console.logger = previous_console if previous_console
  end

  it "rejects an already consumed or deleted invitation token at start" do
    invitation = create(:invitation, company:, recipient_email: user.email, accepted_at: Time.current)
    start_request(invitation_token: invitation.token)
    expect(response.parsed_body["error"]).to eq("invitation_unavailable")
    start_request(invitation_token: "unknown-invitation")
    expect(response.parsed_body["error"]).to eq("invitation_unavailable")
  end

  it "does not issue a token for a foreign current-workspace pointer" do
    grant_membership
    user.update!(current_workspace_id: create(:company).id)
    callback = browser_callback(start_request)
    expect(callback["error"]).to eq("workspace_unavailable")
  end

  it "rechecks kept membership before exchange" do
    grant_membership
    started = start_request
    callback = browser_callback(started)
    user.employments.kept.first.discard!
    exchange(started, callback)
    expect(response.parsed_body["error"]).to eq("invalid_handoff")
  end

  it "rejects wrong PKCE and expired codes without a credential response" do
    grant_membership
    started = start_request
    callback = browser_callback(started)
    exchange(started, callback, code_verifier: SecureRandom.urlsafe_base64(32))
    expect(response.parsed_body["error"]).to eq("invalid_handoff")
    travel 61.seconds do
      exchange(started, callback)
      expect(response.parsed_body["error"]).to eq("invalid_handoff")
    end
  end

  it "returns provider failure only to the fixed app callback without credentials" do
    observed_strategy = nil
    allow(OmniAuth.config.on_failure).to receive(:call).and_wrap_original do |original, env|
      observed_strategy = env["omniauth.error.strategy"]
      original.call(env)
    end
    started = start_request
    callback = browser_callback(started, :invalid_credentials)
    expect(observed_strategy).to be_a(OmniAuth::Strategies::GoogleOauth2)
    expect(observed_strategy.name).to eq("google_oauth2")
    expect(response.location).to start_with("miru-native-ios://auth/google?")
    expect(callback.keys).to match_array(%w[request_id state error])
    expect(callback["error"]).to eq("provider_error")
  end

  it "preserves GitHub failure handling after an abandoned native Google browser start" do
    started = start_request
    get started.fetch("authorization_url")
    record = NativeGoogleAuthRequest.find_request!(started.fetch("request_id"))
    OmniAuth.config.mock_auth[:github] = :invalid_credentials
    post user_github_omniauth_callback_path, params: { strategy: "google_oauth2" }
    expect(response).to redirect_to("https://app.miru.so/")
    expect(flash[:alert]).to include("Invalid credentials")
    expect(record.reload.cancelled_at).to be_nil
    expect(record.outcome).to be_nil

    grant_membership
    OmniAuth.config.mock_auth[:google_oauth2] = auth
    post user_google_oauth2_omniauth_callback_path
    callback = URI.decode_www_form(URI.parse(response.location).query.to_s).to_h
    expect(exchange(started, callback)["status"]).to eq("signed_in")
  end

  it "rejects native failures without middleware strategy identity despite a Google query parameter" do
    started = start_request
    get started.fetch("authorization_url")
    record = NativeGoogleAuthRequest.find_request!(started.fetch("request_id"))
    OmniAuth.config.mock_auth[:google_oauth2] = :invalid_credentials
    allow(OmniAuth.config.on_failure).to receive(:call).and_wrap_original do |original, env|
      env.delete("omniauth.error.strategy")
      original.call(env)
    end
    post user_google_oauth2_omniauth_callback_path, params: { strategy: "google_oauth2" }
    expect(response).to have_http_status(:bad_request)
    expect(response.location).to be_nil
    expect(record.reload.cancelled_at).to be_nil
    expect(record.outcome).to be_nil
  end

  it "renders a CSRF-protected provider POST and refuses a forged browser start" do
    started = start_request
    with_forgery_protection do
      get started.fetch("authorization_url")
      page = Nokogiri::HTML(response.body)
      expect(page.at_css("form")["method"]).to eq("post")
      expect(page.at_css("form")["action"]).to eq(user_google_oauth2_omniauth_authorize_path)
      expect(page.at_css('input[name="authenticity_token"]')["value"]).to be_present
      OmniAuth.config.mock_auth[:google_oauth2] = auth
      post user_google_oauth2_omniauth_authorize_path
      expect(response).to have_http_status(:unprocessable_content)
      expect(NativeGoogleAuthRequest.find_request!(started.fetch("request_id")).outcome).to be_nil
      expect(user.identities.google_auth).to be_empty
    end
  end

  it "throttles the combined native request, exchange and browser endpoints" do
    Rack::Attack.enabled = true
    Rack::Attack.cache.store.clear
    4.times { start_request }
    3.times do
      post "/api/v1/native/auth/google/exchanges", params: {}, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
    3.times do
      get "/native/auth/google/#{'0' * 64}"
      expect(response).to have_http_status(:gone)
    end
    start_request
    expect(response).to have_http_status(:too_many_requests)
  ensure
    Rack::Attack.enabled = false
    Rack::Attack.cache.store.clear
  end
end
