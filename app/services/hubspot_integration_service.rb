# frozen_string_literal: true

class HubspotIntegrationService
  include HTTParty

  attr_reader :email, :first_name, :last_name

  HUBSPOT_URL = "https://api.hsforms.com/submissions/v3/integration/submit/#{ENV["HUBSPOT_SIGNUP_FORM_PORTAL_ID"]}/#{ENV["HUBSPOT_SIGNUP_FORM_FORMID"]}"

  def initialize(email, first_name, last_name)
    @email = email
    @first_name = first_name
    @last_name = last_name
  end

  def process
    payload = {
      fields: [
        {
          name: "email",
          value: email
        },
        {
          name: "firstname",
          value: first_name
        },
        {
          name: "lastname",
          value: last_name
        },
      ]
    }

    HTTParty.post(
      HUBSPOT_URL, body: payload.to_json,
      headers: { "Content-Type" => "application/json" })
  end
end
