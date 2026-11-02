# frozen_string_literal: true

require "rails_helper"

RSpec.describe Employment, "concurrent employee IDs", type: :model do
  before do
    # Thread connections must see committed fixtures and contend on real PostgreSQL locks.
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end

  def concurrently(*operations)
    ready = Queue.new
    start = Queue.new
    threads = operations.map do |operation|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          ready << true
          start.pop
          operation.call
        end
      end
    end
    operations.length.times { ready.pop }
    operations.length.times { start << true }
    threads.map(&:value)
  end

  it "serializes role-first automatic creation without deadlocking company foreign-key locks" do
    company = create(:company)
    users = Array.new(3) { create(:user).tap { |user| user.add_role(:employee, company) } }

    ids = concurrently(*users.map do |user|
      -> { create(:employment, company:, user:, employee_id: nil).employee_id }
    end)

    expect(ids.sort).to eq(%w[SI001 SI002 SI003])
    expect(company.reload.last_employee_number).to eq(3)
  end

  it "keeps automatic allocation and manual corrections unique under contention" do
    company = create(:company)
    automatic_user = create(:user)
    automatic_user.add_role(:employee, company)
    manual = Array.new(2) { create(:employment, company:) }
    results = concurrently(
      -> { create(:employment, company:, user: automatic_user, employee_id: nil).employee_id },
      *manual.map do |employment|
        lambda do
          Employment.find(employment.id).update_profile!(employee_id: "SI001")
          :saved
        rescue ActiveRecord::RecordInvalid
          :duplicate
        end
      end
    )

    expect(results.count(:saved)).to be <= 1
    expect(results).to include(:duplicate)
    ids = company.employments.pluck(:employee_id)
    expect(ids.uniq).to eq(ids)
    expect(ids).to include("SI001")
    expect(company.reload.last_employee_number).to eq(results.first.delete_prefix("SI").to_i)
  end

  it "turns only the employee-ID database race into a validation error" do
    company = create(:company)
    employment = create(:employment, company:)
    competing = create(:employment, company:)
    callback = lambda do |record|
      next unless record.id == employment.id

      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          Employment.find(competing.id).update_columns(employee_id: "race")
        end
      end.value
    end
    Employment.set_callback(:update, :before, callback)

    expect { employment.update_profile!(employee_id: "race") }
      .to raise_error(ActiveRecord::RecordInvalid, /already been taken/)
    expect(employment.reload.employee_id).not_to eq("race")
    expect(company.reload.last_employee_number).to eq(0)

    other_user = create(:user)
    expect { employment.user.update_columns(email: other_user.email) }
      .to raise_error(ActiveRecord::RecordNotUnique) { |error| expect(Employment.employee_id_conflict?(error)).to be(false) }
  ensure
    Employment.skip_callback(:update, :before, callback) if callback
  end
end
