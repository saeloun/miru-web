# frozen_string_literal: true

class RemoveNotNullConstraintForDescriptionInProjects < ActiveRecord::Migration[7.0]
  def up
    change_column_null :projects, :description, true
  end

  def down
    change_column_null :projects, :description, false
  end
end
