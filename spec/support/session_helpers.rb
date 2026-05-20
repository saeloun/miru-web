# frozen_string_literal: true

module SessionHelpers
  SYSTEM_TEST_PASSWORD = "Password123!"

  def sign_in_through_ui(user)
    ensure_user_setup(user)

    visit "/login"
    wait_for_react_app
    type_login_field("email", user.email)
    type_login_field("password", SYSTEM_TEST_PASSWORD)
    click_on "Sign in"
  end

  def sign_in(user)
    ensure_user_setup(user)

    Capybara.reset_sessions!
    company = user.companies.find(user.current_workspace_id)
    role = user.roles.where(resource: company).pick(:name)
    response = nil

    2.times do
      load_login_page
      response = login_via_api(user)
      break if response["ok"]

      ensure_user_setup(user)
    end

    if response["ok"]
      apply_auth_payload(response.fetch("data"))
      visit default_path_for(role)
      wait_for_react_app
      apply_auth_payload(response.fetch("data"))
    else
      sign_in_through_ui(user)
    end

    unless page.has_current_path?(default_path_for(role), ignore_query: true, wait: 15)
      sign_in_through_ui(user)
    end

    expect(page).to have_current_path(default_path_for(role), ignore_query: true, wait: 15)
    ensure_authenticated_session!
  end

  def login_via_api(user)
    page.evaluate_async_script(<<~JS, user.email, SYSTEM_TEST_PASSWORD, user.locale || "en-US")
      const [email, password, locale, done] = arguments;

      fetch("/api/v1/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          user: { email, password, locale }
        })
      })
        .then(async response => {
          const data = await response.json();
          done({ ok: response.ok, status: response.status, data });
        })
        .catch(error => done({ ok: false, error: String(error) }));
    JS
  end

  def apply_auth_payload(payload)
    page.execute_script(<<~JS, payload)
      const payload = arguments[0];
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem("user", JSON.stringify(payload.user));
      window.localStorage.setItem("company_role", payload.company_role || "");
      window.localStorage.setItem("company", JSON.stringify(payload.company));
    JS
  end

  def wait_for_react_app
    expect(page).to have_css("#react-root", wait: 15)
  end

  def ensure_authenticated_session!
    page.execute_script(<<~JS)
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("authEmail");
    JS
  end

  def ensure_user_setup(user)
    if user.current_workspace_id.nil? || !user.companies.exists?(id: user.current_workspace_id)
      company = user.companies.first || create(:company)
      create(:employment, user:, company:) unless user.employments.exists?(company:)
      user.update!(current_workspace_id: company.id)
    end

    current_company = user.companies.find_by(id: user.current_workspace_id)

    unless current_company
      current_company = create(:company)
      create(:employment, user:, company: current_company)
      user.update!(current_workspace_id: current_company.id)
    end

    unless user.has_any_role?(:admin, :owner, :employee, :book_keeper, :client)
      user.add_role(:employee, current_company)
    end

    user.update_columns(encrypted_password: Devise::Encryptor.digest(User, SYSTEM_TEST_PASSWORD))
    user.confirm unless user.confirmed?
  end

  def navigate_to_spa_page(path)
    visit path
    wait_for_react_app
  end

  def load_login_page
    attempts = 0

    begin
      visit "/login"
      wait_for_react_app
    rescue Ferrum::PendingConnectionsError, Ferrum::TimeoutError
      attempts += 1
      raise if attempts > 2

      page.driver.browser.reset
      retry
    end
  end

  def type_login_field(field, value)
    input = find_field(field)
    input.click
    input.send_keys(value, :tab)
  end

  def default_path_for(role)
    case role
    when "admin", "owner"
      "/dashboard"
    when "book_keeper"
      "/payments"
    when "client"
      "/invoices"
    else
      "/time-tracking"
    end
  end

  def skip_react_app_for_functionality_test
    true
  end
end
