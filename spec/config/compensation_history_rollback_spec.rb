# frozen_string_literal: true

require "rails_helper"
require Rails.root.join("db/migrate/20261116000000_add_superseded_at_to_compensation_versions")
require Rails.root.join("db/migrate/20261118000000_add_reviewed_at_to_compensation_versions")

RSpec.describe "Compensation history metadata rollback" do
  let(:connection) { ActiveRecord::Base.connection }

  before do
    @schema = "salary_history_rollback_#{SecureRandom.hex(8)}"
    @original_search_path = connection.schema_search_path
    connection.execute("CREATE SCHEMA #{@schema}")
    connection.schema_search_path = @schema
    connection.create_table(:compensation_versions) do |table|
      table.datetime :superseded_at
      table.datetime :reviewed_at
    end
  end

  after do
    connection.schema_search_path = @original_search_path if @original_search_path
    connection.execute("DROP SCHEMA IF EXISTS #{@schema} CASCADE") if @schema
  end

  it "preserves retain and abandon decisions before removing either metadata column" do
    [[AddReviewedAtToCompensationVersions, "reviewed_at"],
     [AddReviewedAtToCompensationVersions, "superseded_at"],
     [AddSupersededAtToCompensationVersions, "superseded_at"]].each do |migration, column|
      connection.execute("DELETE FROM compensation_versions")
      connection.execute("INSERT INTO compensation_versions (#{column}) VALUES (CURRENT_TIMESTAMP)")
      original = connection.select_all("SELECT * FROM compensation_versions ORDER BY id").to_a

      expect { migration.new.migrate(:down) }.to raise_error(ActiveRecord::IrreversibleMigration)

      expect(connection.select_all("SELECT * FROM compensation_versions ORDER BY id").to_a).to eq(original)
      expect(connection.columns(:compensation_versions).map(&:name)).to include("superseded_at", "reviewed_at")
    end
  end

  it "allows unused metadata to roll back and reapply without defaulting old rows" do
    AddReviewedAtToCompensationVersions.new.migrate(:down)
    AddSupersededAtToCompensationVersions.new.migrate(:down)
    expect(connection.columns(:compensation_versions).map(&:name)).to eq(["id"])

    AddSupersededAtToCompensationVersions.new.migrate(:up)
    AddReviewedAtToCompensationVersions.new.migrate(:up)

    columns = connection.columns(:compensation_versions).index_by(&:name)
    %w[superseded_at reviewed_at].each do |name|
      expect(columns.fetch(name).null).to be(true)
      expect(columns.fetch(name).default).to be_nil
    end
  end
end
