# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Scoped interviewer hiring notes", type: :request do
  include_context "interview message records"
  let(:notes) { "SCOPED INTERVIEWER CONTEXT" }

  before { sign_in admin }

  def update_details(details)
    patch "/api/v1/hiring/applications/#{application.id}/interviews/#{round.id}", params: { hiring_interview: {
      company_id: company.id, application_version: application.reload.lock_version, interview_version: round.reload.lock_version,
      action: "update", details:, panel: round.panel_snapshot.map { |member| member.slice("panel_member_id", "compensation_access") }
    } }, as: :json
  end

  it "shares explicitly scoped notes with assigned staff without cancelling an existing booking or exposing Admin notes" do
    issued = booking
    original = issued.attributes.slice("status", "starts_at", "ends_at", "round_details")
    update_details(round.details.merge("hiring_notes" => notes))
    expect(response).to have_http_status(:ok), response.body
    expect(issued.reload.attributes.slice(*original.keys)).to eq(original)
    expect(round.reload.read_attribute_before_type_cast("details")).not_to include(notes)
    sign_out admin
    sign_in interviewer
    get "/api/v1/hiring/interview_reviews/#{round.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body.dig("interview", "details", "hiring_notes")).to eq(notes)
    expect(response.body).not_to include("PRIVATE ADMIN NOTE")
    stranger = create(:user, current_workspace: company)
    create(:employment, company:, user: stranger, resigned_at: nil)
    stranger.add_role(:employee, company)
    sign_out interviewer
    sign_in stranger
    get "/api/v1/hiring/interview_reviews/#{round.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include(notes)
  end

  it "supports new booking snapshots while excluding notes from candidate messages" do
    update_details(round.details.merge("hiring_notes" => notes))
    expect(response).to have_http_status(:ok), response.body
    issued = booking
    expect(issued.round_details.fetch("hiring_notes")).to eq(notes)
    approve
    preview = Hiring::InterviewCommunication.new(interview: round.reload, booking: issued, actor: admin)
      .preview!(kind: "interview_invitation", mailbox_id: mailbox.id)
    expect(preview.fetch("body")).to include("Bring a project")
    expect(preview.to_json).not_to include(notes, "PRIVATE ADMIN NOTE", "PRIVATE CRITERIA")
  end

  [nil, {}, "x" * 5001, "unsafe\u0000text"].each do |invalid|
    it "rejects invalid internal notes #{invalid.class}/#{invalid.to_s.length} without rewriting the issued round" do
      original = round.details.deep_dup
      update_details(original.merge("hiring_notes" => invalid))
      expect(response).to have_http_status(422), response.body
      expect(round.reload.details).to eq(original)
    end
  end

  it "still cancels a booking when public preparation changes along with scoped notes" do
    issued = booking
    update_details(round.details.merge("preparation" => "Bring another project", "hiring_notes" => notes))
    expect(response).to have_http_status(:ok), response.body
    expect(issued.reload.status).to eq("cancelled")
  end
end
