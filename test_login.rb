require "net/http"
require "json"
require "uri"

# Test login for vipul@saeloun.com
def test_login(email, password = "password")
  uri = URI("http://127.0.0.1:3000/internal_api/v1/users/login")

  # First get CSRF token from the homepage
  homepage_uri = URI("http://127.0.0.1:3000/")
  http = Net::HTTP.new(homepage_uri.host, homepage_uri.port)

  # Get homepage to establish session and get CSRF token
  homepage_response = http.get(homepage_uri.path)

  # Extract CSRF token from meta tag or response headers
  csrf_token = nil
  cookies = []

  # Get cookies from response
  if homepage_response["Set-Cookie"]
    cookies = homepage_response["Set-Cookie"].split(", ")
  end

  # Extract CSRF token from HTML response
  if homepage_response.body =~ /name="csrf-token" content="([^"]+)"/
    csrf_token = $1
    puts "Found CSRF token: #{csrf_token[0..20]}..."
  else
    puts "No CSRF token found in response"
  end

  # Now attempt login
  http = Net::HTTP.new(uri.host, uri.port)

  request = Net::HTTP::Post.new(uri)
  request["Content-Type"] = "application/json"
  request["Accept"] = "application/json"
  request["X-CSRF-Token"] = csrf_token if csrf_token

  # Add cookies to request
  if cookies.any?
    request["Cookie"] = cookies.join("; ")
  end

  # Login payload
  payload = {
    user: {
      email: email,
      password: password
    }
  }

  request.body = payload.to_json

  puts "Attempting login for #{email}..."
  puts "CSRF Token: #{csrf_token ? 'Present' : 'Missing'}"
  puts "Cookies: #{cookies.any? ? 'Present' : 'Missing'}"

  response = http.request(request)

  puts "Response Code: #{response.code}"
  puts "Response Body: #{response.body[0..500]}..."

  if response.code == "200"
    puts "✅ Login successful!"
    true
  else
    puts "❌ Login failed!"
    false
  end
rescue => e
  puts "Error during login test: #{e.message}"
  false
end

# Test with vipul@saeloun.com
test_login("vipul@saeloun.com")
