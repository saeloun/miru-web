# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring interviewer panel", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:interviewer) { create(:user, current_workspace: company) }
  let!(:staff) { create(:employment, company:, user: interviewer, resigned_at: nil) }
  let(:details) do
    { expertise: "Rails and PostgreSQL", availability: "Weekdays, 14:00–18:00 Asia/Kolkata",
      booking_url: "https://calendar.example.test/synthetic-interviewer" }
  end

  before do
    admin.add_role(:admin, company)
    interviewer.add_role(:employee, company)
    sign_in admin
  end

  def add_member(**changes)
    post "/api/v1/hiring/panel_members", params: {
      hiring_panel_member: { company_id: company.id, employment_id: staff.id, details: }.merge(changes)
    }, as: :json
  end

  it "keeps encrypted expertise, availability and a booking link for an active staff member" do
    add_member
    expect(response).to have_http_status(:created)
    member = response.parsed_body.fetch("panel_member")
    expect(member).to include("employment_id" => staff.id, "full_name" => interviewer.full_name, "active" => true, "lock_version" => 0)
    expect(member.fetch("details")).to eq(details.stringify_keys)
    raw = HiringPanelMember.connection.select_value("SELECT details FROM hiring_panel_members WHERE id = #{member.fetch('id').to_i}")
    expect(raw).not_to include("PostgreSQL", "Asia/Kolkata", "calendar.example.test")

    get "/api/v1/hiring/panel_members", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("panel_members")).to eq([member])
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(HiringMessage.count).to eq(0)
  end

  it "rejects foreign or inactive members and unsafe booking links" do
    foreign = create(:employment, resigned_at: nil)
    [foreign.id, "#{staff.id}invalid", true].each do |identity|
      add_member(employment_id: identity)
      expect(response).to have_http_status(:unprocessable_content)
    end
    staff.update!(resigned_at: Date.yesterday)
    add_member
    expect(response).to have_http_status(:unprocessable_content)
    staff.update!(resigned_at: nil)
    ["javascript:alert(1)", "data:text/html,unsafe", "http://calendar.example.test", "https://user:secret@calendar.example.test", "https://calendar.example.test\nInjected"].each do |url|
      add_member(details: details.merge(booking_url: url))
      expect(response).to have_http_status(:unprocessable_content)
    end
    expect(HiringPanelMember.count).to eq(0)
  end

  it "retains an empty optional profile without storing SQL null" do
    add_member(details: {})
    expect(response).to have_http_status(:created)
    expect(response.parsed_body.dig("panel_member", "details")).to eq({})
    expect(HiringPanelMember.find(response.parsed_body.dig("panel_member", "id")).details).to eq({})
  end

  it "updates a saved panel profile only at its current version and preserves historical inactive members" do
    add_member
    expect(response).to have_http_status(:created)
    member = response.parsed_body.fetch("panel_member")
    patch "/api/v1/hiring/panel_members/#{member.fetch('id')}", params: {
      hiring_panel_member: { company_id: company.id, lock_version: 0, details: details.merge(booking_url: "", expertise: "Ruby") }
    }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("panel_member", "details", "expertise")).to eq("Ruby")
    patch "/api/v1/hiring/panel_members/#{member.fetch('id')}", params: {
      hiring_panel_member: { company_id: company.id, lock_version: 0, details: }
    }, as: :json
    expect(response).to have_http_status(:conflict)
    staff.update!(resigned_at: Date.yesterday)
    get "/api/v1/hiring/panel_members", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("panel_members").sole).to include("active" => false)
    expect(HiringPanelMember.find(member.fetch("id")).details.fetch("expertise")).to eq("Ruby")
  end
end
