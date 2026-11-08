# frozen_string_literal: true

module PayrollSchemaDumper
  private

    def tables(stream)
      super
      return unless @connection.adapter_name == "PostgreSQL"

      tables = %w[payroll_runs payroll_revisions payroll_approvals payroll_mercury_recipient_links payroll_payment_events payroll_india_credits].select { |table| @connection.table_exists?(table) }
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
      return unless @connection.table_exists?("payroll_india_handoffs")

      stream.puts <<~RUBY.indent(2)
        execute <<~SQL
          CREATE OR REPLACE FUNCTION protect_payroll_india_handoff() RETURNS trigger LANGUAGE plpgsql AS $$
          BEGIN
            IF TG_OP = 'DELETE' OR
              (to_jsonb(OLD) - ARRAY['credited_minor','released_at','fully_credited_at','updated_at']) IS DISTINCT FROM
              (to_jsonb(NEW) - ARRAY['credited_minor','released_at','fully_credited_at','updated_at']) THEN
              RAISE EXCEPTION 'Payroll India handoff snapshot is immutable';
            END IF;
            IF NEW.credited_minor < OLD.credited_minor OR
              (OLD.released_at IS NOT NULL AND NEW.released_at IS DISTINCT FROM OLD.released_at) OR
              (OLD.fully_credited_at IS NOT NULL AND NEW.fully_credited_at IS DISTINCT FROM OLD.fully_credited_at) THEN
              RAISE EXCEPTION 'Payroll India handoff credit and final timestamps cannot go backwards';
            END IF;
            RETURN NEW;
          END;
          $$;
          CREATE TRIGGER payroll_india_handoff_immutable BEFORE UPDATE OR DELETE ON payroll_india_handoffs
          FOR EACH ROW EXECUTE FUNCTION protect_payroll_india_handoff();
          CREATE OR REPLACE FUNCTION protect_payroll_india_delivery() RETURNS trigger LANGUAGE plpgsql AS $$
          BEGIN
            IF TG_OP = 'DELETE' OR NEW.payroll_india_handoff_id IS DISTINCT FROM OLD.payroll_india_handoff_id OR
              NEW.attempt_number IS DISTINCT FROM OLD.attempt_number OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
              RAISE EXCEPTION 'Payroll India delivery identity is immutable';
            END IF;
            RETURN NEW;
          END;
          $$;
          CREATE TRIGGER payroll_india_delivery_immutable BEFORE UPDATE OR DELETE ON payroll_india_deliveries
          FOR EACH ROW EXECUTE FUNCTION protect_payroll_india_delivery();
        SQL
      RUBY
    end
end

ActiveRecord::SchemaDumper.prepend(PayrollSchemaDumper)
