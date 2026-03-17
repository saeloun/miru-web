# frozen_string_literal: true

module SessionHelpers
  def sign_in(user)
    ensure_user_setup(user)

    Capybara.reset_sessions!
    Warden.test_mode!
    Warden.test_reset!
    logout(:user) if respond_to?(:logout)
    login_as(user, scope: :user)
    company = user.companies.find(user.current_workspace_id)
    role = user.roles.where(resource: company).pick(:name)

    visit "/"
    wait_for_react_app

    page.execute_script <<~JS
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem("authToken", #{user.token.to_json}.replace(/^"|"$/g, ""));
      window.localStorage.setItem("authEmail", #{user.email.to_json}.replace(/^"|"$/g, ""));
      window.localStorage.setItem("user", JSON.stringify(#{user.to_json}));
      window.localStorage.setItem("company_role", #{role.to_json}.replace(/^"|"$/g, ""));
      window.localStorage.setItem("company", JSON.stringify(#{company.to_json}));
    JS
    visit default_path_for(role)
    wait_for_react_app
    expect(page).to have_current_path(default_path_for(role), ignore_query: true, wait: 15)
  end

  def wait_for_react_app
    expect(page).to have_css("#react-root", wait: 15)
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

    user.confirm unless user.confirmed?
  end

  def navigate_to_spa_page(path)
    visit path
    wait_for_react_app
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
