# frozen_string_literal: true

class BackfillAuditCompanyAssociations < ActiveRecord::Migration[8.1]
  def up
    safety_assured { backfill_associations }
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end

  private

    def backfill_associations
      execute <<~SQL.squish
      UPDATE audits SET associated_id = expenses.company_id, associated_type = 'Company'
      FROM expenses
      WHERE audits.auditable_type = 'Expense' AND audits.auditable_id = expenses.id
        AND audits.associated_id IS NULL
      SQL

      execute <<~SQL.squish
      UPDATE audits SET associated_id = invoices.company_id, associated_type = 'Company'
      FROM invoices
      WHERE audits.auditable_type = 'Invoice' AND audits.auditable_id = invoices.id
        AND audits.associated_id IS NULL
      SQL

      execute <<~SQL.squish
      UPDATE audits SET associated_id = invoices.company_id, associated_type = 'Company'
      FROM payments
      INNER JOIN invoices ON invoices.id = payments.invoice_id
      WHERE audits.auditable_type = 'Payment' AND audits.auditable_id = payments.id
        AND audits.associated_id IS NULL
      SQL

      execute <<~SQL.squish
      UPDATE audits SET associated_id = clients.company_id, associated_type = 'Company'
      FROM timesheet_entries
      INNER JOIN projects ON projects.id = timesheet_entries.project_id
      INNER JOIN clients ON clients.id = projects.client_id
      WHERE audits.auditable_type = 'TimesheetEntry' AND audits.auditable_id = timesheet_entries.id
        AND audits.associated_id IS NULL
      SQL
    end
end
