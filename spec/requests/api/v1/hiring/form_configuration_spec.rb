# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring candidate form configuration", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:details) { HiringSetting::TEXT_FIELDS.index_with { |field| "Reviewed #{field}" }.merge("client_count" => 4) }

  before do
    admin.add_role(:admin, company)
    sign_in admin
  end

  it "offers the requested applicant fields without enabling a form by default" do
    get "/api/v1/hiring/settings", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    form = response.parsed_body.dig("settings", "form")
    expect(form).to be_a(Hash)
    expect(form.fetch("enabled")).to be(false)
    fields = form.fetch("fields")
    expect(fields.pluck("id")).to contain_exactly("full_name", "email", "phone", "location", "time_zone", "role",
      "total_experience", "relevant_experience", "skills", "work_summary", "linkedin_url", "employment_status",
      "current_role", "current_company", "notice_period", "available_from", "current_compensation",
      "expected_compensation", "resume", "work_samples", "availability")
    expect(fields.select { |field| %w[current_compensation expected_compensation].include?(field["id"]) })
      .to all(include("type" => "compensation", "sensitive" => true))
    expect(HiringSetting.count).to eq(0)
  end

  it "retains encrypted form configuration and revokes approval when it changes" do
    get "/api/v1/hiring/settings", params: { company_id: company.id }
    form = response.parsed_body.dig("settings", "form")
    expect(form).to be_a(Hash)
    form["enabled"] = true
    form.fetch("fields") << { "id" => "custom_references", "label" => "Private references", "type" => "textarea",
                             "required" => false, "sensitive" => true }
    put "/api/v1/hiring/settings",
      params: { hiring_setting: { company_id: company.id, details:, form:, lock_version: nil } }, as: :json
    expect(response).to have_http_status(:ok)
    draft = response.parsed_body.fetch("settings")
    expect(draft.fetch("approved")).to be(false)
    expect(draft.dig("form", "fields")).to include(include("id" => "custom_references", "sensitive" => true))
    setting = company.reload.hiring_setting
    raw = HiringSetting.connection.select_value("SELECT form_schema FROM hiring_settings WHERE id = #{setting.id.to_i}")
    expect(raw).not_to include("Private references", "custom_references")
    post "/api/v1/hiring/settings/approve",
      params: { hiring_setting: { company_id: company.id, lock_version: draft.fetch("lock_version") } }, as: :json
    expect(response).to have_http_status(:ok)
    approved = response.parsed_body.fetch("settings")
    expect(approved.fetch("approved")).to be(true)
    form.fetch("fields").find { |field| field["id"] == "phone" }["required"] = true
    put "/api/v1/hiring/settings",
      params: { hiring_setting: { company_id: company.id, details:, form:, lock_version: approved.fetch("lock_version") } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("settings", "approved")).to be(false)
    expect(setting.reload.approved_at).to be_nil
  end

  it "allows an incomplete form draft but refuses its approval" do
    put "/api/v1/hiring/settings",
      params: { hiring_setting: { company_id: company.id, details:, form: { enabled: true, fields: [] }, lock_version: nil } }, as: :json
    expect(response).to have_http_status(:ok)
    draft = response.parsed_body.fetch("settings")
    expect(draft.fetch("complete")).to be(false)
    post "/api/v1/hiring/settings/approve",
      params: { hiring_setting: { company_id: company.id, lock_version: draft.fetch("lock_version") } }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(company.reload.hiring_setting.approved_at).to be_nil
  end

  it "rejects malformed schemas and compensation downgrades without replacing the approved form" do
    form = Hiring::Form.default_schema.merge("enabled" => true)
    configuration = Hiring::Configure.new(company:, actor: admin)
    setting = configuration.save_draft!(details:, form:, lock_version: nil)
    configuration.approve!(lock_version: setting.lock_version)
    version = setting.reload.lock_version
    fields = form.fetch("fields")
    invalid = [
      form.merge("enabled" => "false"), form.merge("extra" => true), form.merge("fields" => {}),
      form.merge("fields" => fields + [fields.first]),
      form.merge("fields" => fields.map { |field| field["id"] == "current_compensation" ? field.merge("sensitive" => false) : field }),
      form.merge("fields" => fields.map { |field| field["id"] == "resume" ? field.merge("type" => "url") : field }),
      form.merge("fields" => fields + [{ "id" => "custom_bank", "label" => "Bank", "type" => "javascript", "required" => false, "sensitive" => true }]),
      form.merge("fields" => fields.map { |field| field["id"] == "phone" ? field.merge("required" => "true") : field }),
      form.merge("fields" => fields.map { |field| field["id"] == "phone" ? field.merge("label" => "Phone\u0000number") : field }),
      form.merge("fields" => fields.map { |field| field["id"] == "phone" ? field.merge("script" => "untrusted") : field }),
      form.merge("fields" => fields + [{ "id" => "custom_source", "label" => "Source", "type" => "select",
                                      "required" => false, "sensitive" => false, "choices" => ["Referral", "Referral"] }])
    ]
    invalid.each do |schema|
      put "/api/v1/hiring/settings",
        params: { hiring_setting: { company_id: company.id, details:, form: schema, lock_version: version } }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.body).not_to include("untrusted", "javascript")
    end
    [nil, [], "form"].each do |schema|
      put "/api/v1/hiring/settings",
        params: { hiring_setting: { company_id: company.id, details:, form: schema, lock_version: version } }, as: :json
      expect(response).to have_http_status(:bad_request)
    end
    expect(setting.reload.form).to eq(form)
    expect(setting.approved?).to be(true)
    expect(setting.lock_version).to eq(version)
  end

  it "keeps a form when an older client saves only email settings and rejects stale form edits" do
    form = Hiring::Form.default_schema
    configuration = Hiring::Configure.new(company:, actor: admin)
    setting = configuration.save_draft!(details:, form:, lock_version: nil)
    old_version = setting.lock_version
    configuration.approve!(lock_version: old_version)
    version = setting.reload.lock_version
    2.times do
      get "/api/v1/hiring/settings", params: { company_id: company.id }
      expect(response.parsed_body.dig("settings", "approved")).to be(true)
      expect(response.parsed_body.dig("settings", "lock_version")).to eq(version)
    end
    put "/api/v1/hiring/settings",
      params: { hiring_setting: { company_id: company.id, details:, lock_version: version } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("settings", "approved")).to be(true)
    expect(setting.reload.form).to eq(form)
    put "/api/v1/hiring/settings",
      params: { hiring_setting: { company_id: company.id, details:, form: form.merge("enabled" => true), lock_version: old_version } }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(setting.reload.approved?).to be(true)
    expect(setting.form.fetch("enabled")).to be(false)
  end

  it "keeps private custom labels out of audit changes and application telemetry" do
    form = Hiring::Form.default_schema
    form.fetch("fields") << { "id" => "custom_private", "label" => "A confidential client-specific question",
                             "type" => "textarea", "required" => false, "sensitive" => true }
    put "/api/v1/hiring/settings",
      params: { hiring_setting: { company_id: company.id, details:, form:, lock_version: nil } }, as: :json
    expect(response).to have_http_status(:ok)
    audit = company.reload.hiring_setting.audits.last
    expect(audit.user_id).to eq(admin.id)
    expect(audit.audited_changes.to_json).not_to include("form_schema", "custom_private", "confidential")
    filtered = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
      .filter("hiring_setting" => { "form" => form })
    expect(filtered.to_json).not_to include("custom_private", "confidential")
  end
end
