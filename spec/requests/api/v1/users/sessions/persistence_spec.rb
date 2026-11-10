# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Browser session persistence", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "welcome12") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
  end

  after do |example|
    next unless example.exception.is_a?(ActiveRecord::InvalidForeignKey)

    begin
      records = [User, BrowserSession].map do |model|
        connection = model.connection
        record = { model: model.name, database: connection.raw_connection.db, backend_pid: connection.raw_connection.backend_pid,
          connection_id: connection.object_id, open_transactions: connection.open_transactions }
        if @session_fixture_user_id
          begin
            record[:fixture_user_exists] = connection.select_value("SELECT EXISTS(SELECT 1 FROM users WHERE id = #{Integer(@session_fixture_user_id)})")
          rescue StandardError => error
            record[:query_error] = error.class.name
          end
        end
        record
      end
      warn JSON.generate(browser_session_fk_diagnostic: records)
    rescue StandardError => error
      warn JSON.generate(browser_session_fk_diagnostic_error: error.class.name)
    end
  end

  def signed_in_browser
    ActionDispatch::Integration::Session.new(Rails.application).tap do |browser|
      browser.host! "localhost"
      @session_fixture_user_id = user.id
      browser.post api_v1_users_login_path, params: { user: { email: user.email, password: user.password } }
      expect(browser.response).to have_http_status(:ok)
    end
  end

  def legacy_browser(unique_session_id:)
    jar = ActionDispatch::Cookies::CookieJar.build(ActionDispatch::TestRequest.create, {})
    jar.encrypted["_miru_web_session"] = { value: {
      "session_id" => SecureRandom.hex(16),
      "warden.user.user.key" => User.serialize_into_session(user),
      "warden.user.user.session" => { "unique_session_id" => unique_session_id }
    } }
    legacy_cookie = jar["_miru_web_session"]
    browser = ActionDispatch::Integration::Session.new(Rails.application)
    browser.host! "localhost"
    browser.cookies["_miru_web_session"] = legacy_cookie
    [browser, legacy_cookie]
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

  it "keeps transactional fixtures visible when another thread borrows a connection during sign in" do
    pool = User.connection_pool
    fixture_connection = pool.lease_connection
    first_browser = signed_in_browser
    borrowed, release = Queue.new, Queue.new
    borrower = nil
    allow(User).to receive(:find_for_database_authentication).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |authenticated_user|
        expect(authenticated_user.id).to eq(user.id)
        borrower = Thread.new do
          pool.with_connection do |connection|
            borrowed << connection
            Timeout.timeout(5) { release.pop }
          end
        end
        expect(Timeout.timeout(5) { borrowed.pop }).to equal(fixture_connection)
      end
    end

    second_browser = signed_in_browser
    release << true
    borrower.value
    second_browser.delete api_v1_users_logout_path
    expect(second_browser.response).to have_http_status(:ok)
    first_browser.get api_v1_users_me_path
    expect(first_browser.response).to have_http_status(:ok)
    second_browser.get api_v1_users_me_path
    expect(second_browser.response).to have_http_status(:unauthorized)
  ensure
    release << true if release
    borrower&.value
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

  it "retires the previous cookie when the same browser switches accounts" do
    browser = signed_in_browser
    copied_cookie = browser.cookies["_miru_web_session"]
    other_user = create(:user, current_workspace_id: company.id, password: "welcome12")
    create(:employment, company:, user: other_user)
    browser.post api_v1_users_login_path, params: { user: { email: other_user.email, password: other_user.password } }
    expect(browser.response).to have_http_status(:ok)

    replay = ActionDispatch::Integration::Session.new(Rails.application)
    replay.host! "localhost"
    replay.cookies["_miru_web_session"] = copied_cookie
    replay.get api_v1_users_me_path
    expect(replay.response).to have_http_status(:unauthorized)
    browser.get api_v1_users_me_path
    expect(browser.response).to have_http_status(:ok)
    expect(browser.response.parsed_body.dig("user", "id")).to eq(other_user.id)
  end

  it "keeps password changes able to invalidate existing sessions" do
    browser = signed_in_browser
    user.update!(password: "another-password-123")

    browser.get api_v1_users_me_path
    expect(browser.response).to have_http_status(:unauthorized)
  end

  [true, false].each do |with_unique_session_id|
    it "migrates and revokes legacy cookies with unique session id: #{with_unique_session_id}" do
      user.update!(unique_session_id: SecureRandom.hex(16))
      browser, legacy_cookie = legacy_browser(unique_session_id: with_unique_session_id ? user.unique_session_id : nil)
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

  it "does not restore a legacy cookie invalidated before deployment" do
    user.update!(unique_session_id: SecureRandom.hex(16))
    browser, = legacy_browser(unique_session_id: SecureRandom.hex(16))

    browser.get api_v1_users_me_path
    expect(browser.response).to have_http_status(:unauthorized)
    expect(user.browser_sessions).to be_empty
  end
end
