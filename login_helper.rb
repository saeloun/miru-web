#!/usr/bin/env ruby
# Login helper to create a session for testing

require_relative "config/environment"

user = User.find_by(email: "vipul@saeloun.com")
if user
  puts "User found: #{user.email}"
  puts "User ID: #{user.id}"
  puts "Company ID: #{user.current_workspace_id}"

  # Generate a session token
  token = user.create_new_auth_token
  puts "\nAuth Headers:"
  puts "access-token: #{token['access-token']}"
  puts "client: #{token['client']}"
  puts "uid: #{token['uid']}"

  puts "\nYou can use these headers in your browser's developer tools to authenticate API requests."
else
  puts "User not found"
end
