# frozen_string_literal: true

module PayrollSchemaDumper
  private

    def tables(stream)
      super
      return unless @connection.adapter_name == "PostgreSQL"

      dump_pto_guards(stream)

      tables = %w[payroll_runs payroll_revisions payroll_approvals payroll_mercury_recipient_links payroll_payment_events payroll_india_credits consultant_service_fee_reviews].select { |table| @connection.table_exists?(table) }
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
      dump_service_fee_guard(stream)
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

    def dump_pto_guards(stream)
      return unless @connection.table_exists?("payroll_pto_entries")

      functions = %w[protect_payroll_pto_history validate_payroll_pto_policy validate_payroll_pto_entry validate_payroll_pto_recovery validate_payroll_pto_allocation]
      functions.each do |name|
        sql = @connection.select_value(<<~SQL)
          SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public' AND p.proname = #{@connection.quote(name)} AND p.pronargs = 0 AND p.prorettype = 'trigger'::regtype
        SQL
        raise "PTO database guards are missing; apply all payroll PTO migrations before dumping schema" unless sql

        stream.puts "  execute <<~SQL\n#{sql.indent(4)}  SQL"
      end
      tables = %w[consultant_pto_policies payroll_pto_entries payroll_pto_allocations payroll_pto_recoveries]
      names = tables.map { |table| "#{table}_immutable" } + %w[payroll_pto_policy_valid payroll_pto_entry_valid payroll_pto_recovery_valid payroll_pto_allocation_valid]
      definitions = @connection.select_values(<<~SQL)
        SELECT pg_get_triggerdef(t.oid) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname IN (#{tables.map { |name| @connection.quote(name) }.join(',')})
          AND t.tgname IN (#{names.map { |name| @connection.quote(name) }.join(',')}) ORDER BY t.tgname
      SQL
      raise "PTO database triggers are missing; apply all payroll PTO migrations before dumping schema" unless definitions.size == names.size

      definitions.each { |sql| stream.puts "  execute <<~SQL\n    #{sql};\n  SQL" }
    end

    def dump_service_fee_guard(stream)
      return unless @connection.table_exists?("consultant_service_fee_reviews")

      sql = @connection.select_value("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='validate_consultant_service_fee_review' AND pronargs=0 AND prorettype='trigger'::regtype")
      raise "Service fee database guard is missing" unless sql

      stream.puts "  execute <<~SQL\n#{sql.indent(4)}  SQL"
      stream.puts <<~RUBY.indent(2)
        execute <<~SQL
          CREATE TRIGGER consultant_service_fee_review_valid BEFORE INSERT ON consultant_service_fee_reviews
          FOR EACH ROW EXECUTE FUNCTION validate_consultant_service_fee_review();
        SQL
      RUBY
    end
end

ActiveRecord::SchemaDumper.prepend(PayrollSchemaDumper)
