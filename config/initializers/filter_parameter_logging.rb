# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Configure parameters to be partially matched (e.g. passw matches password) and filtered from the log file.
# Use this to limit dissemination of sensitive information.
# See the ActiveSupport::ParameterFilter documentation for supported notations and behaviors.
Rails.application.config.filter_parameters += [
  :passw, :email, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn, :cvv, :cvc,
  :code_verifier, :code_challenge, /\Astate\z/, :request_id,
  /\A(code|recovery_code|nonce)\z/, /\Acredential\z/, :provisioning_uri,
  :tax_declaration, "review.approved_amount", "review.reason", :consultant_compensation, :payroll_preview,
  :pto_policy, :pto_decision, :pto_recovery_review, :service_fee_review, :payroll_payload, :india_handoff, :payroll_india_handoff, :payroll_india_credit, :review_evidence, :evidence_reference, :tax_estimate, :employee_record, :private_details, :employee_payment, :employee_document,
  :salary_details, :profitability_billing_rate, :profitability_scenario, :payroll_mercury_connection,
  :mercury_payment, :payroll_split_arrangement, :consultants, :agreement, :agreement_template, :signature_request, :signature_review,
  :signature_connection, :files, :payload, :webhookEndpoint, /\Aapplication\z/, /\Ahiring_search\z/, /\Aquery\z/,
  :hiring_setting, :hiring_mailbox, :hiring_receipt, :hiring_message, :hiring_form, :screening, :hiring_decision, :hiring_assignment_template,
  :hiring_assessment, :hiring_assignment, :hiring_panel_member, :hiring_interview, :hiring_booking, :hiring_feedback, :hiring_offer, :hiring_onboarding, :offer_portal, :calendar_id, :event_id
]
