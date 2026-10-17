# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Browser session persistence", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "welcome12") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
  end

  def signed_in_browser
    ActionDispatch::Integration::Session.new(Rails.application).tap do |browser|
      browser.host! "localhost"
      browser.post api_v1_users_login_path, params: { user: { email: user.email, password: user.password } }
      expect(browser.response).to have_http_status(:ok)
    end
  end

  it "keeps both browsers signed in after another browser signs in" do
    first_browser = signed_in_browser
    second_browser = signed_in_browser

    [first_browser, second_browser].each do |browser|
      browser.get api_v1_users_me_path
      expect(browser.response).to have_http_status(:ok)
      expect(browser.response.parsed_body.dig("user", "id")).to eq(user.id)
    end
  end

  it "signs out only the browser that requested it" do
    first_browser = signed_in_browser
    second_browser = signed_in_browser
    second_browser.delete api_v1_users_logout_path
    expect(second_browser.response).to have_http_status(:ok)

    first_browser.get api_v1_users_me_path
    expect(first_browser.response).to have_http_status(:ok)
    second_browser.get api_v1_users_me_path
    expect(second_browser.response).to have_http_status(:unauthorized)
  end

  it "keeps and renews the persistent cookie beyond the old thirty-day limit" do
    browser = signed_in_browser
    session_cookie = Array(browser.response.headers["Set-Cookie"]).find do |cookie|
      cookie.start_with?("_miru_web_session=")
    end
    expect(Time.httpdate(session_cookie[/expires=([^;]+)/i, 1])).to be_within(1.minute).of(20.years.from_now)
    expect(session_cookie).to include("httponly", "samesite=lax")

    travel 31.days do
      browser.get api_v1_users_me_path
      expect(browser.response).to have_http_status(:ok)
      renewed_cookie = Array(browser.response.headers["Set-Cookie"]).find do |cookie|
        cookie.start_with?("_miru_web_session=")
      end
      expect(Time.httpdate(renewed_cookie[/expires=([^;]+)/i, 1])).to be_within(1.minute).of(20.years.from_now)
    end
  end

  it "rejects a copied cookie after its browser signs out" do
    browser = signed_in_browser
    other_browser = signed_in_browser
    copied_cookie = browser.cookies["_miru_web_session"]
    browser.delete api_v1_users_logout_path
    expect(browser.response).to have_http_status(:ok)

    replay = ActionDispatch::Integration::Session.new(Rails.application)
    replay.host! "localhost"
    replay.cookies["_miru_web_session"] = copied_cookie
    replay.get api_v1_users_me_path
    expect(replay.response).to have_http_status(:unauthorized)

    other_browser.get api_v1_users_me_path
    expect(other_browser.response).to have_http_status(:ok)
  end

  it "rejects a session whose server record has been removed" do
    browser = signed_in_browser
    user.browser_sessions.delete_all

    browser.get api_v1_users_me_path
    expect(browser.response).to have_http_status(:unauthorized)
    expect(user.browser_sessions).to be_empty
  end

  it "keeps password changes able to invalidate existing sessions" do
    browser = signed_in_browser
    user.update!(password: "another-password-123")

    browser.get api_v1_users_me_path
    expect(browser.response).to have_http_status(:unauthorized)
  end

  [true, false].each do |with_unique_session_id|
    it "migrates and revokes legacy cookies with unique session id: #{with_unique_session_id}" do
      legacy_session = with_unique_session_id ? { "unique_session_id" => SecureRandom.hex(16) } : {}
      jar = ActionDispatch::Cookies::CookieJar.build(ActionDispatch::TestRequest.create, {})
      jar.encrypted["_miru_web_session"] = { value: {
        "session_id" => SecureRandom.hex(16),
        "warden.user.user.key" => User.serialize_into_session(user),
        "warden.user.user.session" => legacy_session
      } }
      legacy_cookie = jar["_miru_web_session"]
      browser = ActionDispatch::Integration::Session.new(Rails.application)
      browser.host! "localhost"
      browser.cookies["_miru_web_session"] = legacy_cookie
      browser.get api_v1_users_me_path
      expect(browser.response).to have_http_status(:ok)
      browser.delete api_v1_users_logout_path
      expect(browser.response).to have_http_status(:ok)

      replay = ActionDispatch::Integration::Session.new(Rails.application)
      replay.host! "localhost"
      replay.cookies["_miru_web_session"] = legacy_cookie
      replay.get api_v1_users_me_path
      expect(replay.response).to have_http_status(:unauthorized)
    end
  end
end
