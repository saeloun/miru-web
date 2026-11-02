# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Payroll document concurrency" do
  def committed(&block)
    Thread.new { ActiveRecord::Base.connection_pool.with_connection(&block) }.value
  end

  def race
    ready = Queue.new
    release = Queue.new
    workers = 2.times.map do |index|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          ready << true
          release.pop
          yield index
        end
      end
    end
    Timeout.timeout(10) do
      2.times { ready.pop }
      2.times { release << true }
      workers.map(&:value)
    end
  ensure
    workers&.each { |worker| worker.kill if worker.alive? }
    workers&.each(&:join)
  end

  def fixture_document
    { io: StringIO.new(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf"))),
      filename: "approved-proof.pdf", content_type: "application/pdf" }
  end

  after do
    DatabaseCleaner.clean
    committed { DatabaseCleaner.clean_with(:truncation, except: %w[ar_internal_metadata schema_migrations]) }
  end

  it "serializes competing publications while retaining both PDFs and one current salary slip" do
    ids, actor_id, employment_id = committed do
      company = create(:company)
      actor = create(:user, current_workspace: company)
      employee = create(:user, current_workspace: company)
      employment = create(:employment, company:, user: employee, resigned_at: nil)
      slips = 2.times.map do
        slip = employment.salary_slips.new(uploaded_by: actor, pay_month: "2026-09-01", source: "Approved provider")
        slip.file.attach(fixture_document)
        slip.save!
        slip
      end
      [slips.map(&:id), actor.id, employment.id]
    end

    expect(race { |index| SalarySlip.find(ids[index]).publish!(actor: User.find(actor_id)); "published" })
      .to eq(%w[published published])
    slips = SalarySlip.where(employment_id:)
    current = slips.published.sole
    previous = slips.where.not(id: current.id).sole
    expect(current.supersedes_id).to eq(previous.id)
    expect(previous.status).to eq("withdrawn")
    expect(slips.map { |slip| slip.file.download }).to all(eq(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf"))))
  end

  it "accepts one competing declaration review without overwriting its decision or reviewer" do
    claim_id, actor_ids = committed do
      company = create(:company)
      employee = create(:user, current_workspace: company)
      actors = 2.times.map { create(:user, current_workspace: company) }
      employment = create(:employment, company:, user: employee, resigned_at: nil)
      claim = employment.tax_declarations.new(tax_year: 2026, category: "investment", claimed_amount: "1000")
      claim.evidence.attach(fixture_document)
      claim.save!
      claim.submit!
      [claim.id, actors.map(&:id)]
    end

    outcomes = race do |index|
      decision = index.zero? ? "approved" : "rejected"
      TaxDeclaration.find(claim_id).review!(actor: User.find(actor_ids[index]), decision:, amount: "900",
        reason: "Evidence review #{index}")
      index
    rescue ActiveRecord::RecordInvalid => error
      raise unless error.record.errors.full_messages.include?("Only the latest submitted declaration can be reviewed")

      "already reviewed"
    end
    winner = outcomes.grep(Integer).sole
    expect(outcomes.count("already reviewed")).to eq(1)
    claim = TaxDeclaration.find(claim_id)
    expect(claim.reviewed_by_id).to eq(actor_ids[winner])
    expect(claim.review_reason).to eq("Evidence review #{winner}")
    expect(claim.status).to eq(winner.zero? ? "approved" : "rejected")
  end
end
