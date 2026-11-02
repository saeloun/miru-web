# frozen_string_literal: true

class CreateSalarySlips < ActiveRecord::Migration[8.1]
  def change
    create_table :salary_slips do |t|
      t.references :employment, null: false, foreign_key: true
      t.references :uploaded_by, null: false, foreign_key: { to_table: :users }
      t.references :published_by, foreign_key: { to_table: :users }
      t.references :withdrawn_by, foreign_key: { to_table: :users }
      t.references :supersedes, foreign_key: { to_table: :salary_slips }
      t.date :pay_month, null: false
      t.string :source, null: false
      t.datetime :published_at
      t.datetime :withdrawn_at
      t.timestamps
    end

    add_index :salary_slips, [:employment_id, :pay_month], unique: true,
      where: "published_at IS NOT NULL AND withdrawn_at IS NULL", name: "index_salary_slips_current_publication"
    add_check_constraint :salary_slips, "EXTRACT(DAY FROM pay_month) = 1", name: "salary_slips_month_start"
  end
end
