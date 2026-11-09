# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Concurrent service-period fee review" do
  def committed(&block)
    Thread.new { ActiveRecord::Base.connection_pool.with_connection(&block) }.value
  end

  def race(&block)
    ready, release = Queue.new, Queue.new
    threads = 2.times.map do |index|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          ready << true
          release.pop
          block.call(index)
        end
      end
    end
    Timeout.timeout(10) do
      2.times { ready.pop }
      2.times { release << true }
      threads.map(&:value)
    end
  ensure
    threads&.each { |thread| thread.kill if thread.alive? }
    threads&.each(&:join)
  end

  after do
    DatabaseCleaner.clean
    committed { DatabaseCleaner.clean_with(:truncation, except: %w[ar_internal_metadata schema_migrations]) }
  end

  it "serializes competing root and successor commands without a fork" do
    employment_id, actor_id = committed do
      company = create(:company, base_currency: "INR")
      enable_synthetic_payroll(company.id)
      actor = create(:user, current_workspace: company)
      create(:employment, company:, user: actor, joined_at: "2020-01-01", resigned_at: nil)
      actor.add_role(:owner, company)
      employment = create(:employment, company:, joined_at: "2026-09-15", resigned_at: nil)
      ConsultantCompensation.create!(employment:, created_by: actor, effective_on: "2026-09-01", monthly_fee: 100_000,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Synthetic entity", change_reason: "Agreed")
      [employment.id, actor.id]
    end
    2.times do
      summary = committed { Payroll::ServiceFeeReview.new(Employment.find(employment_id), actor: User.find(actor_id)).summary(period: "2026-09") }
      outcomes = race do |index|
        Payroll::ServiceFeeReview.new(Employment.find(employment_id), actor: User.find(actor_id)).record!(period: "2026-09",
          amount: index.zero? ? "50000" : "60000", reason: "Concurrent explicit choice", expected_digest: summary[:digest],
          expected_review_id: summary.dig(:current_review, :id).to_s, idempotency_key: SecureRandom.uuid)
        "recorded"
      rescue Payroll::Workflow::Conflict
        "conflict"
      end
      expect(outcomes).to contain_exactly("recorded", "conflict")
    end
    committed do
      rows = ConsultantServiceFeeReview.where(employment_id:).order(:id)
      expect(rows.count).to eq(2)
      expect(rows.last.previous_review_id).to eq(rows.first.id)
      expect(ConsultantServiceFeeReview.heads.where(employment_id:).count).to eq(1)
    end
  end
end
