# frozen_string_literal: true

require "rails_helper"
require "open3"
require "tmpdir"

RSpec.describe "Strong Migrations task keyword forwarding" do
  let(:database_name) { "miru_migration_spec_#{Process.pid}_#{SecureRandom.hex(6)}" }
  let(:migration_version) { "20261017190000" }
  let(:database_options) do
    config = ActiveRecord::Base.connection_db_config.configuration_hash
    {
      host: config[:host], port: config[:port], user: config[:username] || config[:user],
      password: config[:password], dbname: config.fetch(:database)
    }.compact
  end

  around do |example|
    admin = PG.connect(database_options)
    admin.exec("CREATE DATABASE #{PG::Connection.quote_ident(database_name)}")
    created = true
    @connection = PG.connect(database_options.merge(dbname: database_name))
    @connection.exec("CREATE TABLE schema_migrations (version varchar NOT NULL PRIMARY KEY)")
    Dir.mktmpdir("miru-migration-forwarding-") do |directory|
      @directory = directory
      File.write(File.join(directory, "#{migration_version}_create_migration_forwarding_proofs.rb"), migration_source)
      File.write(File.join(directory, "run_task.rb"), task_source)
      example.run
    end
  ensure
    @connection&.close
    admin&.exec("DROP DATABASE #{PG::Connection.quote_ident(database_name)}") if created
    admin&.close
  end

  def migration_source
    <<~'RUBY'
      class CreateMigrationForwardingProofs < ActiveRecord::Migration[8.1]
        def change
          create_table :migration_forwarding_proofs do |table|
            table.string :value
          end
          safety_assured do
            execute <<~SQL
              CREATE FUNCTION protect_migration_forwarding_proofs() RETURNS trigger LANGUAGE plpgsql AS $$
              BEGIN
                RAISE EXCEPTION 'Synthetic migration proof is immutable';
              END;
              $$;
              CREATE TRIGGER migration_forwarding_proofs_immutable BEFORE UPDATE OR DELETE ON migration_forwarding_proofs
              FOR EACH ROW EXECUTE FUNCTION protect_migration_forwarding_proofs();
            SQL
          end
        end
      end
    RUBY
  end

  def task_source
    <<~'RUBY'
      require File.expand_path("config/environment", Dir.pwd)
      database, directory, task = ARGV
      raise "not a synthetic database" unless database.match?(/\Amiru_migration_spec_\d+_[a-f0-9]+\z/)
      config = ActiveRecord::Base.connection_db_config.configuration_hash.merge(
        database: database, migrations_paths: [directory], schema_dump: false
      )
      ENV.delete("DATABASE_URL")
      ActiveRecord::Base.configurations = { "test" => { "primary" => config } }
      ActiveRecord::Base.establish_connection(:test)
      raise "wrong database" unless ActiveRecord::Base.connection_db_config.database == database
      ActiveRecord::Tasks::DatabaseTasks.migrations_paths = [directory]
      ActiveRecord.dump_schema_after_migration = false
      Rails.application.load_tasks
      puts({ database: database, versions_before: ActiveRecord::Base.connection.select_values("SELECT version FROM schema_migrations") }.to_json)
      if task == "keyword_migrate"
        ActiveRecord::Tasks::DatabaseTasks.migrate(nil, skip_initialize: true)
      else
        Rake::Task[task].invoke
      end
      puts({ versions_after: ActiveRecord::Base.connection.select_values("SELECT version FROM schema_migrations") }.to_json)
    RUBY
  end

  def run_task(task)
    output, status = Open3.capture2e(
      { "RAILS_ENV" => "test", "SKIP_VITE_TEST_BUILD" => "1" },
      RbConfig.ruby, File.join(@directory, "run_task.rb"), database_name, @directory, task, chdir: Rails.root.to_s
    )
    expect(status.success?).to be(true), output
    expect(output).to include('"versions_before":[]')
    expect(output).to include(%("versions_after":["#{migration_version}"])), output
  end

  def expect_migration_applied
    expect(@connection.exec("SELECT version FROM schema_migrations").column_values(0)).to eq([migration_version])
    expect(@connection.exec("SELECT to_regclass('migration_forwarding_proofs')").getvalue(0, 0))
      .to eq("migration_forwarding_proofs")
    expect(@connection.exec("SELECT tgname FROM pg_trigger WHERE tgrelid = 'migration_forwarding_proofs'::regclass AND NOT tgisinternal")
      .column_values(0)).to eq(["migration_forwarding_proofs_immutable"])
  end

  it "applies pending migrations through the standard db:migrate task" do
    run_task("db:migrate")
    expect_migration_applied
  end

  it "applies pending migrations through the standard db:prepare task" do
    run_task("db:prepare")
    expect_migration_applied
  end

  it "preserves positional and keyword arguments when migrating directly" do
    run_task("keyword_migrate")
    expect_migration_applied
  end
end
