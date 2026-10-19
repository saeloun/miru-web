# frozen_string_literal: true

module PayrollSchemaDumper
  private

    def tables(stream)
      super
      return unless @connection.adapter_name == "PostgreSQL"

      tables = %w[payroll_runs payroll_revisions payroll_approvals].select { |table| @connection.table_exists?(table) }
      return if tables.empty?

      stream.puts <<~RUBY.indent(2)
        execute <<~SQL
          CREATE OR REPLACE FUNCTION protect_payroll_review_history() RETURNS trigger LANGUAGE plpgsql AS $$
          BEGIN
            RAISE EXCEPTION 'Payroll review history is immutable';
          END;
          $$;
        SQL
      RUBY
      tables.each do |table|
        stream.puts <<~RUBY.indent(2)
          execute <<~SQL
            CREATE TRIGGER #{table}_immutable BEFORE UPDATE OR DELETE ON #{table}
            FOR EACH ROW EXECUTE FUNCTION protect_payroll_review_history();
          SQL
        RUBY
      end
    end
end

ActiveRecord::SchemaDumper.prepend(PayrollSchemaDumper)
