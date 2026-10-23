# frozen_string_literal: true

require "rails_helper"
require Rails.root.join("db/migrate/20261023150100_add_unique_company_employee_ids")

RSpec.describe AddUniqueCompanyEmployeeIds do
  let(:connection) { ActiveRecord::Base.connection }
  let(:index_name) { "index_employments_on_company_employee_id" }
  let(:migration) { described_class.new }

  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
    raise "Concurrent index specs must not run in a transaction" if connection.open_transactions.positive?

    @schema = "employee_id_index_spec_#{SecureRandom.hex(8)}"
    @original_search_path = connection.schema_search_path
    connection.execute("CREATE SCHEMA #{@schema}")
    connection.schema_search_path = @schema
    connection.execute("CREATE TABLE employments (id bigserial PRIMARY KEY, company_id bigint NOT NULL, employee_id varchar, discarded_at timestamp)")
  end

  after do
    connection.schema_search_path = @original_search_path if @original_search_path
    connection.execute("DROP SCHEMA IF EXISTS #{@schema} CASCADE") if @schema
  end

  def index
    connection.indexes(:employments).find { |item| item.name == index_name }
  end

  def index_oid
    connection.select_value("SELECT '#{index_name}'::regclass::oid")
  end

  it "refuses exact duplicates across discarded history without changing or exposing employee IDs" do
    connection.execute(<<~SQL)
      INSERT INTO employments (company_id, employee_id, discarded_at) VALUES
        (42, 'private-employee-id', NULL), (42, 'private-employee-id', NOW())
    SQL
    original = connection.select_all("SELECT * FROM employments ORDER BY id").to_a

    expect { migration.migrate(:up) }.to raise_error(StandardError, /duplicate.*42/i) { |error|
      expect(error.message).not_to include("private-employee-id")
    }
    expect(connection.select_all("SELECT * FROM employments ORDER BY id").to_a).to eq(original)
    expect(index).to be_nil
  end

  it "replaces a failed concurrent build's invalid index on retry" do
    connection.execute("INSERT INTO employments (company_id, employee_id) VALUES (1, 'legacy'), (1, 'legacy')")
    expect do
      connection.add_index :employments, [:company_id, :employee_id], name: index_name,
        unique: true, where: "employee_id IS NOT NULL AND btrim(employee_id) <> ''", algorithm: :concurrently
    end.to raise_error(ActiveRecord::RecordNotUnique)
    expect(index).not_to be_valid
    invalid_oid = index_oid
    connection.execute("DELETE FROM employments WHERE id = (SELECT MAX(id) FROM employments)")

    migration.migrate(:up)

    expect(index).to be_valid
    expect(index_oid).not_to eq(invalid_oid)
    expect(connection.select_value("SELECT COUNT(*) FROM employments")).to eq(1)
    expect { connection.execute("INSERT INTO employments (company_id, employee_id) VALUES (1, 'legacy')") }
      .to raise_error(ActiveRecord::RecordNotUnique)
  end

  it "keeps a valid correct index and its exact scoped predicate on retry, then reverses it" do
    connection.execute(<<~SQL)
      INSERT INTO employments (company_id, employee_id) VALUES
        (1, 'ID'), (2, 'ID'), (1, 'id'), (1, NULL), (1, NULL), (1, ' '), (1, ' ')
    SQL
    migration.migrate(:up)
    original_oid = index_oid

    expect { migration.migrate(:up) }.not_to raise_error
    expect(index_oid).to eq(original_oid)
    expect(index).to be_valid
    expect(index.unique).to be(true)
    expect { connection.execute("INSERT INTO employments (company_id, employee_id) VALUES (1, 'ID')") }
      .to raise_error(ActiveRecord::RecordNotUnique)
    migration.migrate(:down)
    expect(index).to be_nil
  end

  it "preserves a conflicting healthy index and fails clearly" do
    connection.add_index :employments, :employee_id, name: index_name, algorithm: :concurrently
    original_oid = index_oid

    expect { migration.migrate(:up) }.to raise_error(StandardError, /#{index_name}.*definition/i)
    expect(index).to be_valid
    expect(index_oid).to eq(original_oid)
    expect(index.columns).to eq(["employee_id"])
    expect(index.unique).to be(false)
  end
end
