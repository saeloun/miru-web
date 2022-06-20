# frozen_string_literal: true

require_relative("./verifiers/user_default_social_account_verifier.rb")

class AddPersonalDetailFieldsToUsers < ActiveRecord::Migration[7.0]
  def up
    User.find_each do |user|
      user.social_accounts = { "github_url": "", "linkedin_url": "" }
      user.save!
    end
    UserDefaultSocialAccountVerifier.verify!
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
