# frozen_string_literal: true

class CreateSecondFactorChallenges < ActiveRecord::Migration[8.1]
  def change
    create_table :second_factor_challenges do |t|
      t.references :user, null: false, foreign_key: true
      t.datetime :expires_at, null: false
    end
  end
end
