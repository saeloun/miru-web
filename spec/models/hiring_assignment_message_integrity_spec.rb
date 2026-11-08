# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Assignment message database constraints" do
  include_context "assignment message records"

  let(:record) do
    approve_assignment_messages
    communication = Hiring::AssignmentCommunication.new(assignment:, actor: admin)
    communication.queue!(attributes: communication.preview!(kind: "assignment", mailbox_id: mailbox.id).fetch("intent")).first
  end

  it "rejects a mismatched assignment message event and duplicate operation in PostgreSQL" do
    identity = record.id
    expect do
      HiringMessage.transaction(requires_new: true) { HiringMessage.where(id: identity).update_all(event_key: "offer:#{assignment.id}") }
    end.to raise_error(ActiveRecord::StatementInvalid, /hiring_message_event/)
    expect do
      HiringMessage.transaction(requires_new: true) { record.dup.save!(validate: false) }
    end.to raise_error(ActiveRecord::RecordNotUnique)
    expect(record.reload.event_key).to eq("assignment:#{assignment.id}")
  end

  it "refuses to remove message support with recorded assignment history before any DDL" do
    record
    require Rails.root.join("db/migrate/20261108040000_add_hiring_assignment_messages")
    require Rails.root.join("db/migrate/20261108040100_validate_hiring_assignment_messages")
    connection = ActiveRecord::Base.connection
    query = "SELECT conname, pg_get_constraintdef(oid), convalidated FROM pg_constraint WHERE conrelid = 'hiring_messages'::regclass ORDER BY conname"
    before = connection.select_rows(query)
    expect { AddHiringAssignmentMessages.new.down }.to raise_error(ActiveRecord::IrreversibleMigration)
    expect { ValidateHiringAssignmentMessages.new.down }.to raise_error(ActiveRecord::IrreversibleMigration)
    expect(connection.select_rows(query)).to eq(before)
  end
end
