# frozen_string_literal: true

require "rails_helper"

RSpec.describe Imports::HarvestTimeEntriesImporter do
  let(:company) { create(:company, base_currency: "INR", date_format: "MM-DD-YYYY") }
  let(:actor) { create(:user, current_workspace_id: company.id) }
  let(:paul) { create(:user, first_name: "Paul", last_name: "Connors", email: "paul@example.com", current_workspace_id: company.id) }
  let(:jane) { create(:user, first_name: "Jane", last_name: "Doe", email: "jane@example.com", current_workspace_id: company.id) }
  let(:data_import) { create(:data_import, company:, user: actor, options:) }
  let(:options) { {} }
  let(:fixture_path) { Rails.root.join("spec/fixtures/files/harvest_detailed_time.csv") }

  before do
    create(:employment, company:, user: actor)
    create(:employment, company:, user: paul)
    create(:employment, company:, user: jane)
    attach_csv(data_import, fixture_path)
  end

  it "creates clients, projects, members, and entries with Harvest values" do
    described_class.new(data_import).process

    expect(data_import.reload).to have_attributes(
      status: "completed",
      total_rows: 12,
      imported_rows: 11,
      failed_rows: 0,
      skipped_rows: 1
    )
    expect(company.clients.kept.pluck(:name)).to contain_exactly("Acme LLC", "Very Long Client Name T-715152")
    expect(company.projects.kept.count).to eq(3)
    expect(ProjectMember.kept.joins(project: :client).where(clients: { company_id: company.id }).count).to eq(3)

    website = company.projects.kept.find_by!(name: "Website")
    expect(website).to have_attributes(billable: true, description: "Harvest project code: WEB")
    expect(website.timesheet_entries.kept.where(note: "Meeting - Daily sync").count).to eq(2)

    first_entry = website.timesheet_entries.kept.find_by!(note: "Programming - Built landing\nand tests")
    expect(first_entry).to have_attributes(duration: 75, bill_status: "unbilled", source: "import")
    expect(first_entry.source_metadata).to eq("tool" => "harvest")
    expect(website.timesheet_entries.kept.find_by!(duration: 1523)).to be_billed
    internal = company.projects.kept.find_by!(name: "Internal")
    expect(internal).not_to be_billable
    expect(internal.timesheet_entries.kept).to all(be_non_billable)
    expect(company.clients.kept.find_by!(name: "Very Long Client Name T-715152").currency).to eq("USD")
    expect(website.project_members.kept.find_by!(user: paul).hourly_rate).to eq(150)
  end

  it "avoids per-row project membership and company queries" do
    select_queries = 0
    project_member_queries = 0
    company_queries = 0
    subscriber = lambda do |*, payload|
      sql = payload[:sql]
      next unless sql.start_with?("SELECT")

      select_queries += 1
      project_member_queries += 1 if sql.include?('FROM "project_members"')
      company_queries += 1 if sql.include?('FROM "companies"')
    end

    ActiveSupport::Notifications.subscribed(subscriber, "sql.active_record") do
      described_class.new(data_import).process
    end

    expect(select_queries).to be < 66
    expect(project_member_queries).to be < 6
    expect(company_queries).to be < 6
  end

  it "matches users by name and rounds decimal hours to minutes" do
    described_class.new(data_import).process

    advisory = company.projects.kept.find_by!(name: "Advisory")
    entry = advisory.timesheet_entries.kept.find_by!(note: "Research - Memo")
    expect(entry).to have_attributes(user: jane, duration: 80)
    expect(data_import.reload.summary.dig("users", "matched")).to include(
      "Jane Doe" => "jane@example.com",
      "Paul Connors" => "paul@example.com"
    )
  end

  context "with a user map" do
    let(:jane) { create(:user, first_name: "Janet", last_name: "Smith", email: "jane@example.com", current_workspace_id: company.id) }
    let(:options) { { "user_map" => { "Jane Doe" => "jane@example.com" } } }

    it "maps a Harvest name to a workspace email" do
      described_class.new(data_import).process

      expect(company.projects.kept.find_by!(name: "Advisory").timesheet_entries.kept.pluck(:user_id)).to all(eq(jane.id))
    end
  end

  context "with an unmatched user" do
    before { jane.employments.find_by!(company:).discard! }

    it "records an error for every unmatched row and continues" do
      described_class.new(data_import).process

      expect(data_import.reload).to have_attributes(status: "completed", imported_rows: 7, failed_rows: 4)
      expect(data_import.row_errors).to all(include("message" => include("No team member in this Miru workspace matches Harvest user \"Jane Doe\"")))
      expect(data_import.summary.dig("users", "unmatched")).to eq(["Jane Doe"])
    end
  end

  context "with an ambiguous user name" do
    before do
      duplicate = create(:user, first_name: "paul", last_name: "CONNORS", current_workspace_id: company.id)
      create(:employment, company:, user: duplicate)
    end

    it "requires an explicit user mapping" do
      described_class.new(data_import).process

      messages = data_import.reload.row_errors.pluck("message")
      expect(messages).to all(eq(
        "Harvest user \"Paul Connors\" matches more than one team member; pass --map \"Paul Connors=their@email\"."
      ))
      expect(data_import.summary.dig("users", "unmatched")).to include("Paul Connors")
    end
  end

  context "with assign_unmatched_to" do
    let(:fallback) { create(:user, first_name: "Fallback", last_name: "User", email: "fallback@example.com", current_workspace_id: company.id) }
    let(:options) { { "assign_unmatched_to" => "fallback@example.com" } }

    before do
      jane.employments.find_by!(company:).discard!
      create(:employment, company:, user: fallback)
    end

    it "assigns otherwise unmatched rows to the selected user" do
      described_class.new(data_import).process

      expect(data_import.reload.failed_rows).to eq(0)
      expect(company.projects.kept.find_by!(name: "Advisory").timesheet_entries.kept.pluck(:user_id)).to all(eq(fallback.id))
    end
  end

  context "with a dry run" do
    let(:data_import) { create(:data_import, company:, user: actor, options:, dry_run: true) }

    it "only writes import bookkeeping and reports the plan" do
      expect do
        described_class.new(data_import).process
      end.not_to change { [Client.count, Project.count, ProjectMember.count, TimesheetEntry.count] }

      expect(data_import.reload).to have_attributes(status: "completed", imported_rows: 0, skipped_rows: 1)
      expect(data_import.summary).to include(
        "rows" => 12,
        "entries_to_create" => 11,
        "zero_hour_skipped" => 1,
        "duplicates_skipped" => 0
      )
      expect(data_import.summary.dig("clients", "to_create")).to contain_exactly("Acme LLC", "Very Long Client Name T-715152")
      expect(data_import.summary.dig("projects", "to_create")).to contain_exactly(
        "Acme LLC / Internal",
        "Acme LLC / Website",
        "Very Long Client Name T-715152 / Advisory"
      )
      expect(data_import.summary.dig("date_range")).to eq("from" => "2026-01-02", "to" => "2026-01-11")
      expect(data_import.summary).not_to have_key("row_errors")
    end
  end

  it "matches users, clients, and projects case-insensitively" do
    paul.update!(first_name: "PAUL", last_name: "connors")
    client = create(:client, company:, name: "acme llc")
    project = create(:project, client:, name: "website", billable: true)

    described_class.new(data_import).process

    expect(company.clients.where("LOWER(name) = ?", "acme llc").count).to eq(1)
    expect(client.projects.where("LOWER(name) = ?", "website").count).to eq(1)
    expect(project.timesheet_entries.kept.where(user: paul)).to exist
  end

  it "parses dates using the company day-month-year format" do
    company.update!(date_format: "DD-MM-YYYY")
    attach_csv_contents(data_import, <<~CSV)
      Date,Client,Project,Hours,First Name,Last Name
      07-01-2026,Acme LLC,Website,1,Paul,Connors
    CSV

    described_class.new(data_import).process

    expect(TimesheetEntry.kept.last.work_date).to eq(Date.new(2026, 1, 7))
  end

  it "keeps project names distinct when their 30-character prefixes collide" do
    attach_csv_contents(data_import, <<~CSV)
      Date,Client,Project,Project Code,Hours,First Name,Last Name
      2026-01-01,Acme LLC,Acme 1H 2025 Committed Hours (PC),PC,1,Paul,Connors
    CSV

    described_class.new(data_import).process

    second_import = create(:data_import, company:, user: actor)
    attach_csv_contents(second_import, <<~CSV)
      Date,Client,Project,Hours,First Name,Last Name
      2026-01-02,Acme LLC,Acme 1H 2025 Committed Hours (LW),1,Paul,Connors
    CSV
    described_class.new(second_import).process

    projects = company.projects.kept.order(:name)
    expect(projects.pluck(:name).uniq.size).to eq(2)
    expect(projects.pluck(:name).map(&:length)).to all(be <= 30)
    expect(projects.pluck(:description)).to contain_exactly(
      "Harvest project: Acme 1H 2025 Committed Hours (LW)",
      "Harvest project: Acme 1H 2025 Committed Hours (PC)\nHarvest project code: PC"
    )
    expect(projects.flat_map { |project| project.timesheet_entries.kept.pluck(:work_date) }).to contain_exactly(
      Date.new(2026, 1, 1),
      Date.new(2026, 1, 2)
    )
    expect(data_import.reload.summary["warnings"]).to include(match(/Project name truncated:/))

    reimport = create(:data_import, company:, user: actor)
    attach_csv_contents(reimport, <<~CSV)
      Date,Client,Project,Hours,First Name,Last Name
      2026-01-02,Acme LLC,Acme 1H 2025 Committed Hours (LW),1,Paul,Connors
      2026-01-01,Acme LLC,Acme 1H 2025 Committed Hours (PC),1,Paul,Connors
    CSV

    expect do
      described_class.new(reimport).process
    end.not_to change { [company.projects.kept.count, TimesheetEntry.kept.count] }
    expect(reimport.reload).to have_attributes(imported_rows: 0, skipped_rows: 2)
  end

  it "keeps client names distinct when their 30-character prefixes collide" do
    attach_csv_contents(data_import, <<~CSV)
      Date,Client,Project,Hours,First Name,Last Name
      2026-01-01,Acme Corporate Legal Services Alpha,Website,1,Paul,Connors
    CSV

    described_class.new(data_import).process

    second_import = create(:data_import, company:, user: actor)
    attach_csv_contents(second_import, <<~CSV)
      Date,Client,Project,Hours,First Name,Last Name
      2026-01-02,Acme Corporate Legal Services Bravo,Website,1,Paul,Connors
    CSV
    described_class.new(second_import).process

    expect(company.clients.kept.pluck(:name).uniq.size).to eq(2)
    expect(company.projects.kept.count).to eq(2)
    expect(data_import.reload.summary["warnings"]).to include(match(/Client name truncated:/))
  end

  it "reuses unambiguous client and project names created by the legacy importer" do
    client_name = "Acme Corporate Legal Services Alpha"
    project_name = "Acme 1H 2025 Committed Hours (PC)"
    create(:data_import, company:, user: actor, status: "completed", summary: {
      "warnings" => ["Client name truncated: #{client_name}", "Project name truncated: #{project_name}"]
    })
    legacy_client = create(:client, company:, name: client_name.first(30))
    legacy_project = create(:project, client: legacy_client, name: project_name.first(30))
    create(:timesheet_entry, project: legacy_project, user: paul, work_date: Date.new(2026, 1, 1), duration: 60, note: "", source: "import")
    attach_csv_contents(data_import, <<~CSV)
      Date,Client,Project,Hours,First Name,Last Name
      2026-01-01,#{client_name},#{project_name},1,Paul,Connors
    CSV

    expect do
      described_class.new(data_import).process
    end.not_to change { [company.clients.count, company.projects.count, TimesheetEntry.count] }

    expect(data_import.reload).to have_attributes(imported_rows: 0, skipped_rows: 1)
  end

  it "records invalid hours, date, and blank client rows without creating entries" do
    attach_csv_contents(data_import, <<~CSV)
      Date,Client,Project,Hours,First Name,Last Name
      2026-01-01,Acme LLC,Website,abc,Paul,Connors
      31-31-2026,Acme LLC,Website,1,Paul,Connors
      2026-01-03,,Website,1,Paul,Connors
    CSV

    expect do
      described_class.new(data_import).process
    end.not_to change(TimesheetEntry, :count)

    expect(data_import.reload.row_errors).to eq([
      { "row" => 2, "message" => "Hours is invalid" },
      { "row" => 3, "message" => "Date is invalid: 31-31-2026" },
      { "row" => 4, "message" => "Client is blank" }
    ])
  end

  it "skips entries already imported without de-duplicating rows within the file" do
    described_class.new(data_import).process
    second_import = create(:data_import, company:, user: actor)
    attach_csv(second_import, fixture_path)

    expect do
      described_class.new(second_import).process
    end.not_to change(TimesheetEntry, :count)

    expect(second_import.reload).to have_attributes(imported_rows: 0, skipped_rows: 12)
    expect(second_import.summary["duplicates_skipped"]).to eq(11)
    expect(second_import.summary["date_range"]).to eq("from" => "2026-01-02", "to" => "2026-01-11")
  end

  it "rejects files missing required headers" do
    invalid_import = create(:data_import, company:, user: actor)
    invalid_import.file.attach(io: StringIO.new("Date,Client\n2026-01-01,Acme\n"), filename: "invalid.csv", content_type: "text/csv")

    expect do
      described_class.new(invalid_import).process
    end.to raise_error(described_class::InvalidFileError, /Missing required headers: Project, Hours, First Name, Last Name/)
  end

  it "reports client name truncation" do
    described_class.new(data_import).process

    expect(data_import.reload.summary["warnings"]).to include(
      "Client name truncated: Very Long Client Name That Exceeds Thirty Characters"
    )
  end

  it "shortens long project names deterministically" do
    client = create(:client, company:, name: "Acme LLC")
    attach_csv_contents(data_import, <<~CSV)
      Date,Client,Project,Hours,First Name,Last Name,Billable?
      2026-01-01,Acme LLC,A Project Name Longer Than Thirty Characters,1,Paul,Connors,Yes
    CSV

    described_class.new(data_import).process

    project = client.projects.find_by!(name: "A Project Name Longer T-ae2f52")
    expect(project.timesheet_entries.kept).to exist
    expect(data_import.reload.summary["warnings"]).to include(
      "Project name truncated: A Project Name Longer Than Thirty Characters"
    )

    reimport = create(:data_import, company:, user: actor)
    attach_csv_contents(reimport, <<~CSV)
      Date,Client,Project,Hours,First Name,Last Name,Billable?
      2026-01-01,Acme LLC,A PROJECT NAME LONGER THAN THIRTY CHARACTERS,1,Paul,Connors,Yes
    CSV

    expect do
      described_class.new(reimport).process
    end.not_to change { [client.projects.count, TimesheetEntry.kept.count] }
  end

  it "restores an archived client before importing entries" do
    client = create(:client, company:, name: "Acme LLC")
    client.discard!

    described_class.new(data_import).process

    expect(client.reload).to be_kept
    expect(client.projects.kept.find_by!(name: "Website").timesheet_entries.kept).to exist
    expect(data_import.reload.summary["warnings"]).to include("Restored archived client: Acme LLC")
  end

  it "restores an archived project before importing entries" do
    client = create(:client, company:, name: "Acme LLC")
    project = create(:project, client:, name: "Website", billable: true)
    project.discard!

    described_class.new(data_import).process

    expect(project.reload).to be_kept
    expect(project.timesheet_entries.kept).to exist
    expect(data_import.reload.summary["warnings"]).to include("Restored archived project: Acme LLC / Website")
  end

  it "schedules the uploaded CSV for purge after a real run" do
    expect do
      described_class.new(data_import).process
    end.to have_enqueued_job(ActiveStorage::PurgeJob).with(data_import.file.blob)
  end

  it "keeps an existing non-billable project non-billable and warns once" do
    client = create(:client, company:, name: "Acme LLC")
    project = create(:project, client:, name: "Website", billable: false)

    described_class.new(data_import).process

    expect(project.timesheet_entries.kept).to all(be_non_billable)
    warnings = data_import.reload.summary["warnings"].grep(/Acme LLC \/ Website/)
    expect(warnings).to contain_exactly("Harvest marks Acme LLC / Website billable, but the Miru project is non-billable")
  end

  def attach_csv(import, path)
    File.open(path) do |file|
      import.file.attach(io: file, filename: File.basename(path), content_type: "text/csv")
    end
  end

  def attach_csv_contents(import, contents)
    import.file.attach(io: StringIO.new(contents), filename: "harvest.csv", content_type: "text/csv")
  end
end
