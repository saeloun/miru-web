# frozen_string_literal: true

namespace :billing do
  desc "Set billing_exempt for a company by owner email"
  task :exempt, [:email] => :environment do |_t, args|
    email = args[:email] || "vipul@saeloun.com"
    user = User.find_by(email: email)
    abort "User #{email} not found" unless user

    company = user.current_workspace
    abort "No workspace for #{email}" unless company

    company.update!(billing_exempt: true)
    puts "Set billing_exempt=true for '#{company.name}' (id: #{company.id})"
    puts "team_member_limit: #{company.team_member_limit}"
    puts "pro_access: #{company.pro_access?}"
  end
end
