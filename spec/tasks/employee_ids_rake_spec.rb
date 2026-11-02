# frozen_string_literal: true

require "rails_helper"
require "rake"

RSpec.describe "employee_ids:backfill" do
  let(:company) { create(:company) }
  let(:actor) { create(:user) }
  let(:task) { Rake::Task["employee_ids:backfill"] }

  before(:all) { Rails.application.load_tasks if Rake::Task.tasks.empty? }
  before do
    create(:employment, company:, user: actor)
    actor.add_role(:admin, company)
    task.reenable
  end

  it "assigns missing staff IDs deterministically with count-only attribution and is idempotent" do
    original_workspace_id = actor.current_workspace_id
    first = create(:employment, company:, employee_id: nil, joined_at: nil, resigned_at: nil)
    second = create(:employment, company:, employee_id: nil)
    first.user.add_role(:employee, company)
    second.user.add_role(:manager, company)
    [first, second].each { |employment| employment.update_columns(employee_id: nil) }
    client = create(:employment, company:, employee_id: nil)
    client.user.add_role(:client, company)
    create(:employment, company:, employee_id: "SI063", discarded_at: Time.current)

    expect { task.invoke(company.id, actor.id) }.to output("assigned=2 skipped=1\n").to_stdout
    expect(first.reload.employee_id).to eq("SI064")
    expect(second.reload.employee_id).to eq("SI065")
    expect(first.joined_at).to be_nil
    expect(client.reload.employee_id).to be_nil
    expect(actor.reload.current_workspace_id).to eq(original_workspace_id)
    audit = Audited::Audit.where(comment: "Missing staff employee IDs assigned").last
    expect(audit.user_id).to eq(actor.id)
    expect(audit.audited_changes).to eq("employee_ids" => { "assigned" => 2, "skipped" => 1 })
    task.reenable
    expect { task.invoke(company.id, actor.id) }.to output("assigned=0 skipped=1\n").to_stdout
  end

  it "rejects a nonadministrator and a former administrator" do
    actor.remove_role(:admin, company)
    actor.add_role(:employee, company)
    expect { task.invoke(company.id, actor.id) }.to raise_error(Pundit::NotAuthorizedError)
    task.reenable
    actor.add_role(:admin, company)
    actor.employments.kept.find_by!(company:).discard!
    expect { task.invoke(company.id, actor.id) }.to raise_error(Pundit::NotAuthorizedError)
  end

  it "rolls the whole company's assignments and audit back on failure" do
    missing = Array.new(2) do
      create(:employment, company:, employee_id: nil).tap do |employment|
        employment.user.add_role(:employee, company)
        employment.update_columns(employee_id: nil)
      end
    end
    create(:employment, company:, employee_id: "SI#{Employment::MAX_EMPLOYEE_NUMBER - 1}")

    expect { task.invoke(company.id, actor.id) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(missing.map { |employment| employment.reload.employee_id }).to eq([nil, nil])
    expect(company.reload.last_employee_number).to eq(Employment::MAX_EMPLOYEE_NUMBER - 1)
    expect(Audited::Audit.where(comment: "Missing staff employee IDs assigned")).to be_empty
  end
end
