# frozen_string_literal: true

class TruncateProjectNameToProject < ActiveRecord::Migration[7.0]
  def change
    Project.find_each do |project|
      project.update(name: project.name.slice(0, 30))
    end
  end
end
