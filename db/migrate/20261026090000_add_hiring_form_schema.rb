# frozen_string_literal: true

class AddHiringFormSchema < ActiveRecord::Migration[8.1]
  def change
    add_column :hiring_settings, :form_schema, :text
  end
end
