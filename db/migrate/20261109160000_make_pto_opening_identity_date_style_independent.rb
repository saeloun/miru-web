# frozen_string_literal: true

class MakePtoOpeningIdentityDateStyleIndependent < ActiveRecord::Migration[8.1]
  def up
    definition = select_value("SELECT pg_get_functiondef('public.validate_payroll_pto_entry()'::regprocedure)")
    unless definition.scan("p.opening_on::text").one?
      raise "Unexpected PTO opening validation definition"
    end

    safety_assured { execute definition.sub("p.opening_on::text", "to_char(p.opening_on, 'YYYY-MM-DD')") }
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Keep the DateStyle-independent PTO opening validation"
  end
end
