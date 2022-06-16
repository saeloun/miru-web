# frozen_string_literal: true

class UserDefaultSocialAccountVerifier
  def self.verify!
    User.find_each do |user|
      unless user.social_accounts === { "github_url" => "", "linkedin_url" => "" }
        raise "Social account urls(github_url & linkedin_url) not set to empty strings for User ID #{user.id}"
      end
    end

    puts "All social account urls(github_url & linkedin_url) set to Empty Strings."
  end
end
