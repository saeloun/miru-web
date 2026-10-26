# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_26_090200) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pg_stat_statements"
  enable_extension "pg_trgm"
  enable_extension "unaccent"

  create_table "action_mailbox_inbound_emails", force: :cascade do |t|
    t.integer "status", default: 0, null: false
    t.string "message_id", null: false
    t.string "message_checksum", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["message_id", "message_checksum"], name: "index_action_mailbox_inbound_emails_uniqueness", unique: true
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "addresses", force: :cascade do |t|
    t.string "address_line_1", null: false
    t.string "address_line_2"
    t.string "address_type", default: "current"
    t.bigint "addressable_id"
    t.string "addressable_type"
    t.string "city", null: false
    t.string "country", null: false
    t.datetime "created_at", null: false
    t.string "pin", null: false
    t.string "state", null: false
    t.datetime "updated_at", null: false
    t.index ["addressable_type", "addressable_id", "address_type"], name: "index_addresses_on_addressable_and_address_type", unique: true
    t.index ["addressable_type", "addressable_id"], name: "index_addresses_on_addressable"
  end

  create_table "agent_keys", force: :cascade do |t|
    t.bigint "agent_id", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.datetime "last_used_at"
    t.string "name", null: false
    t.datetime "revoked_at"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["agent_id", "revoked_at"], name: "index_agent_keys_on_agent_id_and_revoked_at"
    t.index ["agent_id"], name: "index_agent_keys_on_agent_id"
    t.index ["created_by_id"], name: "index_agent_keys_on_created_by_id"
    t.index ["token_digest"], name: "index_agent_keys_on_token_digest", unique: true
  end

  create_table "agents", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "default_project_id"
    t.jsonb "metadata", default: {}, null: false
    t.string "name", null: false
    t.string "provider", default: "custom", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["company_id", "active"], name: "index_agents_on_company_id_and_active"
    t.index ["company_id", "name"], name: "index_agents_on_company_id_and_name", unique: true
    t.index ["company_id"], name: "index_agents_on_company_id"
    t.index ["default_project_id"], name: "index_agents_on_default_project_id"
    t.index ["user_id"], name: "index_agents_on_user_id"
  end

  create_table "agreement_templates", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "created_by_id", null: false
    t.string "title", limit: 200, null: false
    t.string "kind", null: false
    t.text "document", null: false
    t.text "fields", null: false
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_agreement_templates_on_company_id"
    t.index ["created_by_id"], name: "index_agreement_templates_on_created_by_id"
    t.check_constraint "kind::text = ANY (ARRAY['client'::character varying, 'consultant'::character varying]::text[])", name: "agreement_templates_kind"
  end

  create_table "agreements", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "created_by_id", null: false
    t.bigint "agreement_template_id"
    t.integer "source_template_version"
    t.bigint "client_id"
    t.bigint "employment_id"
    t.string "title", limit: 200, null: false
    t.string "kind", null: false
    t.string "status", default: "draft", null: false
    t.text "document", null: false
    t.text "fields", null: false
    t.text "field_values", null: false
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["agreement_template_id"], name: "index_agreements_on_agreement_template_id"
    t.index ["client_id"], name: "index_agreements_on_client_id"
    t.index ["company_id"], name: "index_agreements_on_company_id"
    t.index ["created_by_id"], name: "index_agreements_on_created_by_id"
    t.index ["employment_id"], name: "index_agreements_on_employment_id"
    t.check_constraint "agreement_template_id IS NULL AND source_template_version IS NULL OR agreement_template_id IS NOT NULL AND source_template_version IS NOT NULL AND source_template_version >= 0", name: "agreements_source_version"
    t.check_constraint "kind::text = 'client'::text AND client_id IS NOT NULL AND employment_id IS NULL OR kind::text = 'consultant'::text AND employment_id IS NOT NULL AND client_id IS NULL", name: "agreements_counterparty"
    t.check_constraint "status::text = 'draft'::text", name: "agreements_status"
  end

  create_table "ahoy_events", force: :cascade do |t|
    t.string "name"
    t.jsonb "properties"
    t.datetime "time"
    t.bigint "user_id"
    t.bigint "visit_id"
    t.index ["name", "time"], name: "index_ahoy_events_on_name_and_time"
    t.index ["properties"], name: "index_ahoy_events_on_properties", opclass: :jsonb_path_ops, using: :gin
    t.index ["user_id"], name: "index_ahoy_events_on_user_id"
    t.index ["visit_id"], name: "index_ahoy_events_on_visit_id"
  end

  create_table "ahoy_visits", force: :cascade do |t|
    t.string "app_version"
    t.string "browser"
    t.string "city"
    t.string "country"
    t.string "device_type"
    t.string "ip"
    t.text "landing_page"
    t.float "latitude"
    t.float "longitude"
    t.string "os"
    t.string "os_version"
    t.string "platform"
    t.text "referrer"
    t.string "referring_domain"
    t.string "region"
    t.datetime "started_at"
    t.text "user_agent"
    t.bigint "user_id"
    t.string "utm_campaign"
    t.string "utm_content"
    t.string "utm_medium"
    t.string "utm_source"
    t.string "utm_term"
    t.string "visit_token"
    t.string "visitor_token"
    t.index ["user_id"], name: "index_ahoy_visits_on_user_id"
    t.index ["visit_token"], name: "index_ahoy_visits_on_visit_token", unique: true
  end

  create_table "analytics_reports", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.jsonb "filters", default: {}, null: false
    t.string "name", null: false
    t.integer "report_type", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "report_type", "created_at"], name: "index_analytics_reports_on_company_report_type_created_at"
    t.index ["company_id"], name: "index_analytics_reports_on_company_id"
    t.index ["created_by_id"], name: "index_analytics_reports_on_created_by_id"
    t.index ["filters"], name: "index_analytics_reports_on_filters", using: :gin
  end

  create_table "analytics_threshold_notification_logs", force: :cascade do |t|
    t.string "alert_type", null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "notified_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "alert_type"], name: "index_analytics_threshold_logs_on_company_and_alert", unique: true
    t.index ["company_id"], name: "index_analytics_threshold_notification_logs_on_company_id"
  end

  create_table "audits", force: :cascade do |t|
    t.string "action"
    t.integer "associated_id"
    t.string "associated_type"
    t.integer "auditable_id"
    t.string "auditable_type"
    t.text "audited_changes"
    t.string "comment"
    t.datetime "created_at"
    t.string "remote_address"
    t.string "request_uuid"
    t.integer "user_id"
    t.string "user_type"
    t.string "username"
    t.integer "version", default: 0
    t.index ["associated_type", "associated_id"], name: "associated_index"
    t.index ["auditable_type", "auditable_id", "version"], name: "auditable_index"
    t.index ["created_at"], name: "index_audits_on_created_at"
    t.index ["request_uuid"], name: "index_audits_on_request_uuid"
    t.index ["user_id", "user_type"], name: "user_index"
  end

  create_table "browser_sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "revoked_at"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["token_digest"], name: "index_browser_sessions_on_token_digest", unique: true
    t.index ["user_id"], name: "index_browser_sessions_on_user_id"
  end

  create_table "bulk_invoice_download_statuses", force: :cascade do |t|
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.string "download_id"
    t.string "file_url"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["company_id", "download_id"], name: "idx_on_company_id_download_id_432c83202c", unique: true
    t.index ["company_id"], name: "index_bulk_invoice_download_statuses_on_company_id"
  end

  create_table "carryovers", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "discarded_at"
    t.integer "duration"
    t.integer "from_year"
    t.bigint "leave_type_id", null: false
    t.integer "to_year"
    t.integer "total_leave_balance"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["company_id"], name: "index_carryovers_on_company_id"
    t.index ["discarded_at"], name: "index_carryovers_on_discarded_at"
    t.index ["leave_type_id"], name: "index_carryovers_on_leave_type_id"
    t.index ["user_id"], name: "index_carryovers_on_user_id"
  end

  create_table "cli_sessions", force: :cascade do |t|
    t.string "auth_state_digest"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.datetime "last_used_at"
    t.datetime "revoked_at"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["company_id"], name: "index_cli_sessions_on_company_id"
    t.index ["expires_at"], name: "index_cli_sessions_on_expires_at"
    t.index ["token_digest"], name: "index_cli_sessions_on_token_digest", unique: true
    t.index ["user_id"], name: "index_cli_sessions_on_user_id"
  end

  create_table "client_members", force: :cascade do |t|
    t.bigint "client_id", null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "discarded_at"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["client_id", "user_id"], name: "index_client_members_on_client_id_and_user_id", unique: true
    t.index ["client_id"], name: "index_client_members_on_client_id"
    t.index ["company_id"], name: "index_client_members_on_company_id"
    t.index ["discarded_at"], name: "index_client_members_on_discarded_at"
    t.index ["user_id"], name: "index_client_members_on_user_id"
  end

  create_table "clients", force: :cascade do |t|
    t.string "address"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "currency", default: "USD", null: false
    t.datetime "discarded_at"
    t.string "ein"
    t.string "email"
    t.string "name", null: false
    t.string "phone"
    t.boolean "signature_enabled", default: false, null: false
    t.string "stripe_id"
    t.datetime "updated_at", null: false
    t.string "legal_name", limit: 255
    t.string "signatory_name", limit: 255
    t.string "signatory_designation", limit: 255
    t.string "finance_email", limit: 254
    t.string "signatory_email", limit: 254
    t.index ["company_id"], name: "index_clients_on_company_id"
    t.index ["discarded_at"], name: "index_clients_on_discarded_at"
    t.index ["email", "company_id"], name: "index_clients_on_email_and_company_id", unique: true
    t.index ["email"], name: "index_clients_on_email_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["name", "company_id"], name: "index_clients_on_name_and_company_id", unique: true
    t.index ["name"], name: "index_clients_on_name_trgm", opclass: :gin_trgm_ops, using: :gin
  end

  create_table "companies", force: :cascade do |t|
    t.text "address"
    t.string "allowed_sso_domains", default: [], null: false, array: true
    t.string "bank_account_number"
    t.string "bank_name"
    t.string "bank_routing_number"
    t.string "bank_swift_code"
    t.string "base_currency", default: "USD", null: false
    t.boolean "billing_exempt", default: false, null: false
    t.string "business_phone"
    t.boolean "calendar_enabled", default: true
    t.boolean "cancel_at_period_end", default: false, null: false
    t.string "country", null: false
    t.datetime "created_at", null: false
    t.string "date_format"
    t.string "ein"
    t.string "fiscal_year_end"
    t.string "gst_number"
    t.string "name", null: false
    t.string "plan_tier", default: "free", null: false
    t.boolean "sso_enforced", default: false, null: false
    t.decimal "standard_price", default: "0.0", null: false
    t.string "stripe_customer_id"
    t.string "stripe_subscription_id"
    t.datetime "subscription_ends_at"
    t.string "subscription_interval"
    t.string "subscription_status"
    t.string "tax_id"
    t.integer "timesheet_edit_days", default: 30, null: false
    t.string "timezone"
    t.date "trial_email_last_sent_on"
    t.datetime "trial_ends_at"
    t.datetime "trial_expired_email_sent_at"
    t.datetime "trial_started_at"
    t.datetime "updated_at", null: false
    t.string "us_taxpayer_id"
    t.string "vat_number"
    t.string "working_days", default: "5"
    t.string "working_hours", default: "40"
    t.bigint "last_employee_number", default: 0, null: false
    t.string "compensation_proration"
    t.index ["stripe_customer_id"], name: "index_companies_on_stripe_customer_id"
    t.index ["stripe_subscription_id"], name: "index_companies_on_stripe_subscription_id"
  end

  create_table "compensation_report_runs", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "created_by_id", null: false
    t.text "payload", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_compensation_report_runs_on_company_id"
    t.index ["created_by_id"], name: "index_compensation_report_runs_on_created_by_id"
  end

  create_table "compensation_versions", force: :cascade do |t|
    t.bigint "employment_id", null: false
    t.date "effective_on", null: false
    t.text "salary_details", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["employment_id", "effective_on", "id"], name: "index_compensation_versions_effective"
    t.index ["employment_id"], name: "index_compensation_versions_on_employment_id"
  end

  create_table "consultant_compensations", force: :cascade do |t|
    t.text "change_reason", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.date "effective_on", null: false
    t.bigint "employment_id", null: false
    t.decimal "hours_per_day", precision: 4, scale: 2, null: false
    t.string "legal_entity_name", null: false
    t.decimal "monthly_fee", precision: 12, scale: 2, null: false
    t.string "payment_source", null: false
    t.datetime "updated_at", null: false
    t.integer "weekdays", null: false, array: true
    t.index ["created_by_id"], name: "index_consultant_compensations_on_created_by_id"
    t.index ["employment_id", "effective_on", "id"], name: "index_consultant_terms_effective_version"
    t.index ["employment_id"], name: "index_consultant_compensations_on_employment_id"
    t.check_constraint "monthly_fee > 0::numeric AND hours_per_day > 0::numeric AND hours_per_day <= 24::numeric", name: "consultant_compensations_positive_terms"
  end

  create_table "currency_pairs", force: :cascade do |t|
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.string "from_currency", null: false
    t.datetime "last_updated_at"
    t.decimal "rate", precision: 20, scale: 10
    t.string "to_currency", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_currency_pairs_on_active"
    t.index ["from_currency", "to_currency"], name: "index_currency_pairs_on_from_currency_and_to_currency", unique: true
  end

  create_table "custom_leave_users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "custom_leave_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["custom_leave_id"], name: "index_custom_leave_users_on_custom_leave_id"
    t.index ["user_id"], name: "index_custom_leave_users_on_user_id"
  end

  create_table "custom_leaves", force: :cascade do |t|
    t.integer "allocation_period", null: false
    t.integer "allocation_value", null: false
    t.datetime "created_at", null: false
    t.bigint "leave_id", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["leave_id"], name: "index_custom_leaves_on_leave_id"
  end

  create_table "data_imports", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.boolean "dry_run", default: false, null: false
    t.text "error_message"
    t.integer "failed_rows", default: 0, null: false
    t.datetime "finished_at"
    t.integer "imported_rows", default: 0, null: false
    t.string "kind", default: "time_entries", null: false
    t.jsonb "options", default: {}, null: false
    t.jsonb "row_errors", default: [], null: false
    t.integer "skipped_rows", default: 0, null: false
    t.string "source", null: false
    t.datetime "started_at"
    t.string "status", default: "pending", null: false
    t.jsonb "summary", default: {}, null: false
    t.integer "total_rows", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["company_id", "created_at"], name: "index_data_imports_on_company_id_and_created_at"
    t.index ["user_id"], name: "index_data_imports_on_user_id"
  end

  create_table "data_migrations", primary_key: "version", id: :string, force: :cascade do |t|
  end

  create_table "desktop_current_timers", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.jsonb "current_timer", default: {}, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["company_id"], name: "index_desktop_current_timers_on_company_id"
    t.index ["user_id", "company_id"], name: "index_desktop_current_timers_on_user_id_and_company_id", unique: true
    t.index ["user_id"], name: "index_desktop_current_timers_on_user_id"
  end

  create_table "devices", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "device_type", default: "laptop"
    t.string "name"
    t.string "serial_number"
    t.jsonb "specifications"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["company_id"], name: "index_devices_on_company_id"
    t.index ["device_type"], name: "index_devices_on_device_type"
    t.index ["user_id"], name: "index_devices_on_user_id"
  end

  create_table "employee_documents", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "employment_id", null: false
    t.string "kind", null: false
    t.datetime "updated_at", null: false
    t.bigint "uploaded_by_id", null: false
    t.index ["employment_id"], name: "index_employee_documents_on_employment_id"
    t.index ["uploaded_by_id"], name: "index_employee_documents_on_uploaded_by_id"
    t.check_constraint "kind::text = ANY (ARRAY['pan'::character varying, 'contract'::character varying]::text[])", name: "employee_documents_kind"
  end

  create_table "employee_occasion_deliveries", force: :cascade do |t|
    t.bigint "admin_id", null: false
    t.datetime "delivered_at", null: false
    t.bigint "employment_id", null: false
    t.date "event_on", null: false
    t.string "kind", null: false
    t.index ["admin_id"], name: "index_employee_occasion_deliveries_on_admin_id"
    t.index ["employment_id", "admin_id", "kind", "event_on"], name: "index_employee_occasion_deliveries_unique_event", unique: true
    t.index ["employment_id"], name: "index_employee_occasion_deliveries_on_employment_id"
  end

  create_table "employee_payments", force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2, null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.string "currency", null: false
    t.bigint "employment_id", null: false
    t.text "note"
    t.date "paid_on", null: false
    t.string "reference", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_employee_payments_on_created_by_id"
    t.index ["employment_id", "paid_on", "id"], name: "index_employee_payments_on_employment_id_and_paid_on_and_id"
    t.index ["employment_id", "reference"], name: "index_employee_payments_on_employment_id_and_reference", unique: true
    t.index ["employment_id"], name: "index_employee_payments_on_employment_id"
    t.check_constraint "amount > 0::numeric", name: "employee_payments_positive_amount"
  end

  create_table "employee_record_settings", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.boolean "occasion_reminders_enabled", default: false, null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_employee_record_settings_on_company_id", unique: true
  end

  create_table "employee_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "employment_id", null: false
    t.text "private_details", null: false
    t.datetime "updated_at", null: false
    t.index ["employment_id"], name: "index_employee_records_on_employment_id", unique: true
  end

  create_table "employee_reports", force: :cascade do |t|
    t.jsonb "columns", default: [], null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_employee_reports_on_company_id"
  end

  create_table "employments", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "designation"
    t.datetime "discarded_at"
    t.string "employee_id"
    t.string "employment_type"
    t.date "joined_at"
    t.date "resigned_at"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["company_id", "employee_id"], name: "index_employments_on_company_employee_id", unique: true, where: "((employee_id IS NOT NULL) AND (btrim((employee_id)::text) <> ''::text))"
    t.index ["company_id"], name: "index_employments_on_company_id"
    t.index ["discarded_at"], name: "index_employments_on_discarded_at"
    t.index ["user_id"], name: "index_employments_on_user_id"
  end

  create_table "exchange_rate_usages", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "last_fetched_at"
    t.date "month", null: false
    t.integer "requests_count", default: 0
    t.datetime "updated_at", null: false
    t.index ["month"], name: "index_exchange_rate_usages_on_month", unique: true
  end

  create_table "exchange_rates", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.string "from_currency", null: false
    t.decimal "rate", precision: 18, scale: 10, null: false
    t.string "source", default: "manual"
    t.string "to_currency", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_exchange_rates_on_date"
    t.index ["from_currency", "to_currency", "date"], name: "idx_exchange_rates_unique", unique: true
    t.index ["from_currency", "to_currency"], name: "index_exchange_rates_on_from_currency_and_to_currency"
  end

  create_table "expense_categories", force: :cascade do |t|
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.boolean "default", default: false
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_expense_categories_on_company_id"
  end

  create_table "expenses", force: :cascade do |t|
    t.decimal "amount", precision: 20, scale: 2, default: "0.0", null: false
    t.datetime "approved_at"
    t.decimal "base_currency_amount", precision: 20, scale: 2
    t.string "category_name"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "currency", default: "USD"
    t.date "date", null: false
    t.text "description"
    t.datetime "discarded_at"
    t.decimal "exchange_rate", precision: 18, scale: 10
    t.date "exchange_rate_date"
    t.bigint "expense_category_id"
    t.integer "expense_type"
    t.datetime "paid_at"
    t.bigint "project_id"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.bigint "vendor_id"
    t.string "vendor_name"
    t.index ["company_id", "date", "expense_category_id"], name: "index_expenses_on_company_date_category"
    t.index ["company_id", "date", "project_id"], name: "index_expenses_on_company_date_project"
    t.index ["company_id"], name: "index_expenses_on_company_id"
    t.index ["date"], name: "index_expenses_on_date"
    t.index ["description"], name: "index_expenses_on_description_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["discarded_at"], name: "index_expenses_on_discarded_at"
    t.index ["expense_category_id"], name: "index_expenses_on_expense_category_id"
    t.index ["expense_type"], name: "index_expenses_on_expense_type"
    t.index ["project_id"], name: "index_expenses_on_project_id"
    t.index ["status"], name: "index_expenses_on_status"
    t.index ["user_id"], name: "index_expenses_on_user_id"
    t.index ["vendor_id"], name: "index_expenses_on_vendor_id"
    t.check_constraint "currency IS NOT NULL AND currency::text ~ '^[A-Z]{3}$'::text", name: "expenses_currency_iso_code"
  end

  create_table "hiring_applications", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "hiring_candidate_id", null: false
    t.bigint "hiring_role_id"
    t.bigint "owner_employment_id"
    t.bigint "created_by_id"
    t.uuid "request_key", null: false
    t.text "creation_details", null: false
    t.text "notes"
    t.string "source", default: "manual", null: false
    t.string "stage", default: "received", null: false
    t.datetime "received_at", null: false
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "email_key", limit: 64
    t.index ["company_id", "email_key"], name: "index_hiring_applications_on_company_id_and_email_key", unique: true, where: "(email_key IS NOT NULL)"
    t.index ["company_id", "id"], name: "index_hiring_applications_on_company_id_and_id", unique: true
    t.index ["company_id", "received_at", "id"], name: "index_hiring_applications_for_pipeline"
    t.index ["company_id", "request_key"], name: "index_hiring_applications_on_company_id_and_request_key", unique: true
    t.index ["created_by_id"], name: "index_hiring_applications_on_created_by_id"
    t.index ["hiring_candidate_id", "received_at", "id"], name: "index_hiring_applications_for_candidate"
    t.index ["owner_employment_id"], name: "index_hiring_applications_on_owner_employment_id"
    t.check_constraint "source::text = 'manual'::text AND email_key IS NULL OR source::text = 'email'::text AND email_key::text ~ '^[a-f0-9]{64}$'::text", name: "hiring_application_supported_source"
    t.check_constraint "stage::text = ANY (ARRAY['received'::character varying, 'information_pending'::character varying, 'screening'::character varying, 'shortlisted'::character varying, 'assignment_assigned'::character varying, 'assignment_review'::character varying, 'interview'::character varying, 'final_decision'::character varying, 'offer'::character varying, 'hired'::character varying, 'on_hold'::character varying, 'rejection_pending'::character varying, 'rejected'::character varying, 'withdrawn'::character varying, 'no_show'::character varying]::text[])", name: "hiring_application_stage"
  end

  create_table "hiring_candidates", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "full_name", limit: 200, null: false
    t.string "email", limit: 254, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "email"], name: "index_hiring_candidates_on_company_id_and_email", unique: true
    t.index ["company_id", "id"], name: "index_hiring_candidates_on_company_id_and_id", unique: true
    t.check_constraint "email::text = lower(btrim(email::text))", name: "hiring_candidate_normalized_email"
  end

  create_table "hiring_mailboxes", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "name", limit: 200, null: false
    t.string "source_email", limit: 254, null: false
    t.uuid "routing_key", null: false
    t.boolean "active", default: true, null: false
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "id"], name: "index_hiring_mailboxes_on_company_id_and_id", unique: true
    t.index ["company_id", "source_email"], name: "index_hiring_mailboxes_on_company_id_and_source_email", unique: true
    t.index ["routing_key"], name: "index_hiring_mailboxes_on_routing_key", unique: true
    t.check_constraint "source_email::text = lower(btrim(source_email::text))", name: "hiring_mailbox_normalized_email"
  end

  create_table "hiring_messages", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "hiring_application_id", null: false
    t.bigint "hiring_setting_id", null: false
    t.bigint "queued_by_id"
    t.integer "approved_setting_version", null: false
    t.string "kind", default: "acknowledgement", null: false
    t.string "state", default: "queued", null: false
    t.string "error_code", limit: 64
    t.text "content", null: false
    t.datetime "enqueued_at"
    t.datetime "started_at"
    t.datetime "sent_at"
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "original_message_id"
    t.integer "attempt_number", default: 1, null: false
    t.string "resolution", limit: 32
    t.text "resolution_details"
    t.bigint "resolved_by_id"
    t.datetime "resolved_at"
    t.index ["company_id", "hiring_application_id", "id"], name: "index_hiring_messages_on_tenant_application_id", unique: true
    t.index ["company_id", "hiring_application_id", "kind"], name: "index_hiring_messages_on_original_event", unique: true, where: "(original_message_id IS NULL)"
    t.index ["company_id", "original_message_id", "attempt_number"], name: "index_hiring_messages_on_retry_attempt", unique: true, where: "(original_message_id IS NOT NULL)"
    t.index ["hiring_setting_id"], name: "index_hiring_messages_on_hiring_setting_id"
    t.index ["queued_by_id"], name: "index_hiring_messages_on_queued_by_id"
    t.index ["resolved_by_id"], name: "index_hiring_messages_on_resolved_by_id"
    t.index ["state", "enqueued_at"], name: "index_hiring_messages_on_state_and_enqueued_at"
    t.check_constraint "kind::text = 'acknowledgement'::text", name: "hiring_message_kind"
    t.check_constraint "original_message_id IS NULL AND attempt_number = 1 OR original_message_id IS NOT NULL AND original_message_id <> id AND attempt_number > 1", name: "hiring_message_attempt"
    t.check_constraint "resolution IS NULL AND resolved_at IS NULL AND resolved_by_id IS NULL AND resolution_details IS NULL OR resolution IS NOT NULL AND (resolution::text = ANY (ARRAY['accepted'::character varying, 'not_accepted'::character varying]::text[])) AND resolved_at IS NOT NULL AND resolution_details IS NOT NULL", name: "hiring_message_resolution"
    t.check_constraint "state::text = ANY (ARRAY['queued'::character varying::text, 'sending'::character varying::text, 'sent'::character varying::text, 'failed'::character varying::text, 'uncertain'::character varying::text])", name: "hiring_message_state"
  end

  create_table "hiring_portal_accesses", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "hiring_application_id", null: false
    t.bigint "hiring_setting_id", null: false
    t.bigint "issued_by_id"
    t.integer "approved_setting_version", null: false
    t.text "access_token", null: false
    t.text "form_schema", null: false
    t.text "introduction", null: false
    t.datetime "expires_at", null: false
    t.datetime "revoked_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["access_token"], name: "index_hiring_portal_accesses_on_access_token", unique: true
    t.index ["company_id", "hiring_application_id", "id"], name: "index_hiring_portal_accesses_for_submission", unique: true
    t.index ["company_id", "hiring_application_id"], name: "idx_on_company_id_hiring_application_id_8e04c271d1"
    t.index ["hiring_setting_id"], name: "index_hiring_portal_accesses_on_hiring_setting_id"
    t.index ["issued_by_id"], name: "index_hiring_portal_accesses_on_issued_by_id"
  end

  create_table "hiring_receipts", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "hiring_mailbox_id", null: false
    t.bigint "inbound_email_id"
    t.bigint "hiring_application_id"
    t.bigint "reviewed_by_id"
    t.datetime "reviewed_at"
    t.datetime "received_at", null: false
    t.string "source_checksum", limit: 64, null: false
    t.string "message_key", limit: 64
    t.string "state", default: "pending", null: false
    t.string "review_reason", limit: 64
    t.text "details", null: false
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "hiring_mailbox_id", "source_checksum"], name: "index_hiring_receipts_on_mailbox_and_source", unique: true
    t.index ["company_id", "message_key"], name: "index_hiring_receipts_on_company_id_and_message_key"
    t.index ["company_id", "state", "received_at"], name: "index_hiring_receipts_on_company_id_and_state_and_received_at"
    t.index ["hiring_application_id"], name: "index_hiring_receipts_on_hiring_application_id"
    t.index ["inbound_email_id"], name: "index_hiring_receipts_on_inbound_email_id"
    t.index ["reviewed_by_id"], name: "index_hiring_receipts_on_reviewed_by_id"
    t.check_constraint "state::text = ANY (ARRAY['pending'::character varying::text, 'review'::character varying::text, 'accepted'::character varying::text, 'dismissed'::character varying::text])", name: "hiring_receipt_state"
  end

  create_table "hiring_roles", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "title", limit: 200, null: false
    t.string "status", default: "open", null: false
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "id"], name: "index_hiring_roles_on_company_id_and_id", unique: true
    t.check_constraint "status::text = ANY (ARRAY['open'::character varying, 'closed'::character varying]::text[])", name: "hiring_role_status"
  end

  create_table "hiring_screenings", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "hiring_application_id", null: false
    t.bigint "created_by_id"
    t.string "action", null: false
    t.string "from_stage", null: false
    t.string "to_stage", null: false
    t.integer "application_version", null: false
    t.text "details", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "hiring_application_id", "application_version"], name: "index_hiring_screenings_per_version", unique: true
    t.index ["company_id", "hiring_application_id", "id"], name: "idx_on_company_id_hiring_application_id_id_d076a476bc"
    t.index ["created_by_id"], name: "index_hiring_screenings_on_created_by_id"
  end

  create_table "hiring_settings", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "approved_by_id"
    t.datetime "approved_at"
    t.text "details", null: false
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "form_schema"
    t.index ["approved_by_id"], name: "index_hiring_settings_on_approved_by_id"
    t.index ["company_id", "id"], name: "index_hiring_settings_on_company_id_and_id", unique: true
    t.index ["company_id"], name: "index_hiring_settings_on_company_id", unique: true
  end

  create_table "hiring_submissions", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "hiring_application_id", null: false
    t.bigint "hiring_portal_access_id", null: false
    t.text "answers", null: false
    t.datetime "submitted_at"
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "hiring_application_id"], name: "idx_on_company_id_hiring_application_id_bcbb7e18bf"
    t.index ["hiring_portal_access_id"], name: "index_hiring_submissions_on_hiring_portal_access_id", unique: true
  end

  create_table "holiday_infos", force: :cascade do |t|
    t.integer "category", default: 0, null: false
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.datetime "discarded_at"
    t.bigint "holiday_id", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["discarded_at"], name: "index_holiday_infos_on_discarded_at"
    t.index ["holiday_id"], name: "index_holiday_infos_on_holiday_id"
  end

  create_table "holidays", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "discarded_at"
    t.boolean "enable_optional_holidays", default: false
    t.string "holiday_types", default: [], array: true
    t.integer "no_of_allowed_optional_holidays"
    t.integer "time_period_optional_holidays", default: 0, null: false
    t.datetime "updated_at", null: false
    t.integer "year", null: false
    t.index ["company_id"], name: "index_holidays_on_company_id"
    t.index ["discarded_at"], name: "index_holidays_on_discarded_at"
  end

  create_table "identities", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "provider"
    t.string "uid"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["provider"], name: "index_identities_on_provider"
    t.index ["user_id"], name: "index_identities_on_user_id"
  end

  create_table "invitations", force: :cascade do |t|
    t.datetime "accepted_at"
    t.bigint "client_id"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "expired_at"
    t.string "first_name"
    t.string "last_name"
    t.string "recipient_email", null: false
    t.integer "role", default: 0, null: false
    t.bigint "sender_id", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.boolean "virtual_verified", default: false
    t.index ["accepted_at"], name: "index_invitations_on_accepted_at"
    t.index ["client_id"], name: "index_invitations_on_client_id"
    t.index ["company_id"], name: "index_invitations_on_company_id"
    t.index ["expired_at"], name: "index_invitations_on_expired_at"
    t.index ["first_name"], name: "index_invitations_on_first_name_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["last_name"], name: "index_invitations_on_last_name_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["recipient_email"], name: "index_invitations_on_recipient_email"
    t.index ["recipient_email"], name: "index_invitations_on_recipient_email_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["role"], name: "index_invitations_on_role"
    t.index ["sender_id"], name: "index_invitations_on_sender_id"
    t.index ["token"], name: "index_invitations_on_token", unique: true
  end

  create_table "invoice_line_item_time_entries", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "invoice_line_item_id", null: false
    t.bigint "timesheet_entry_id", null: false
    t.datetime "updated_at", null: false
    t.index ["invoice_line_item_id", "timesheet_entry_id"], name: "idx_line_item_time_entries_unique_pair", unique: true
    t.index ["invoice_line_item_id"], name: "idx_line_item_time_entries_on_invoice_line_item_id"
    t.index ["timesheet_entry_id"], name: "idx_line_item_time_entries_on_timesheet_entry_id"
  end

  create_table "invoice_line_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date"
    t.text "description"
    t.bigint "invoice_id", null: false
    t.string "name"
    t.integer "quantity", default: 1
    t.decimal "rate", precision: 20, scale: 2, default: "0.0"
    t.bigint "timesheet_entry_id"
    t.datetime "updated_at", null: false
    t.index ["invoice_id"], name: "index_invoice_line_items_on_invoice_id"
    t.index ["timesheet_entry_id", "date"], name: "index_invoice_line_items_on_timesheet_entry_date"
    t.index ["timesheet_entry_id"], name: "index_invoice_line_items_on_timesheet_entry_id"
  end

  create_table "invoice_taxes", force: :cascade do |t|
    t.decimal "amount", precision: 20, scale: 2, default: "0.0", null: false
    t.integer "calculation_method", default: 0, null: false
    t.datetime "created_at", null: false
    t.bigint "invoice_id", null: false
    t.string "name", null: false
    t.bigint "tax_configuration_id"
    t.datetime "updated_at", null: false
    t.decimal "value", precision: 20, scale: 4, default: "0.0", null: false
    t.index ["invoice_id", "tax_configuration_id"], name: "index_invoice_taxes_on_invoice_id_and_tax_configuration_id"
    t.index ["invoice_id"], name: "index_invoice_taxes_on_invoice_id"
    t.index ["tax_configuration_id"], name: "index_invoice_taxes_on_tax_configuration_id"
  end

  create_table "invoices", force: :cascade do |t|
    t.decimal "amount", precision: 20, scale: 2, default: "0.0"
    t.decimal "amount_due", precision: 20, scale: 2, default: "0.0"
    t.decimal "amount_paid", precision: 20, scale: 2, default: "0.0"
    t.decimal "base_currency_amount", precision: 20, scale: 2, default: "0.0"
    t.bigint "client_id", null: false
    t.datetime "client_payment_sent_at"
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.string "currency", default: "USD", null: false
    t.datetime "discarded_at"
    t.decimal "discount", precision: 20, scale: 2, default: "0.0"
    t.date "due_date"
    t.decimal "exchange_rate", precision: 18, scale: 10
    t.date "exchange_rate_date"
    t.string "external_view_key"
    t.string "invoice_number"
    t.date "issue_date"
    t.decimal "outstanding_amount", precision: 20, scale: 2, default: "0.0"
    t.jsonb "payment_infos", default: {}
    t.datetime "payment_sent_at"
    t.text "reference"
    t.datetime "sent_at"
    t.integer "status", default: 0, null: false
    t.boolean "stripe_enabled", default: true
    t.decimal "tax", precision: 20, scale: 2, default: "0.0"
    t.datetime "updated_at", null: false
    t.index ["client_id", "issue_date", "status"], name: "index_invoices_on_client_issue_date_status"
    t.index ["client_id"], name: "index_invoices_on_client_id"
    t.index ["company_id", "issue_date", "status"], name: "index_invoices_on_company_issue_date_status"
    t.index ["company_id", "status"], name: "index_invoices_on_company_id_and_status"
    t.index ["company_id"], name: "index_invoices_on_company_id"
    t.index ["discarded_at"], name: "index_invoices_on_discarded_at"
    t.index ["due_date"], name: "index_invoices_on_due_date"
    t.index ["external_view_key"], name: "index_invoices_on_external_view_key", unique: true
    t.index ["invoice_number", "company_id"], name: "index_invoices_on_invoice_number_and_company_id", unique: true
    t.index ["invoice_number"], name: "index_invoices_on_invoice_number_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["issue_date"], name: "index_invoices_on_issue_date"
    t.index ["status"], name: "index_invoices_on_status"
  end

  create_table "leave_types", force: :cascade do |t|
    t.integer "allocation_frequency", null: false
    t.integer "allocation_period", null: false
    t.integer "allocation_value", null: false
    t.integer "carry_forward_days", default: 0, null: false
    t.integer "color", null: false
    t.datetime "created_at", null: false
    t.datetime "discarded_at"
    t.integer "icon", null: false
    t.bigint "leave_id", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["color", "leave_id"], name: "index_leave_types_on_color_and_leave_id", unique: true
    t.index ["discarded_at"], name: "index_leave_types_on_discarded_at"
    t.index ["icon", "leave_id"], name: "index_leave_types_on_icon_and_leave_id", unique: true
    t.index ["leave_id"], name: "index_leave_types_on_leave_id"
  end

  create_table "leaves", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "discarded_at"
    t.datetime "updated_at", null: false
    t.integer "year"
    t.index ["company_id"], name: "index_leaves_on_company_id"
    t.index ["discarded_at"], name: "index_leaves_on_discarded_at"
    t.index ["year", "company_id"], name: "index_leaves_on_year_and_company_id", unique: true
  end

  create_table "mcp_idempotency_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "key_digest", null: false
    t.jsonb "response", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_mcp_idempotency_records_on_expires_at"
    t.index ["key_digest"], name: "index_mcp_idempotency_records_on_key_digest", unique: true
  end

  create_table "metrics", force: :cascade do |t|
    t.datetime "calculated_at", null: false
    t.datetime "created_at", null: false
    t.jsonb "data", default: {}, null: false
    t.jsonb "metadata", default: {}
    t.string "metric_type", null: false
    t.string "period", null: false
    t.date "period_date"
    t.bigint "trackable_id", null: false
    t.string "trackable_type", null: false
    t.datetime "updated_at", null: false
    t.decimal "value_avg", precision: 20, scale: 2, default: "0.0"
    t.integer "value_count", default: 0
    t.decimal "value_max", precision: 20, scale: 2
    t.decimal "value_min", precision: 20, scale: 2
    t.decimal "value_sum", precision: 20, scale: 2, default: "0.0"
    t.index ["calculated_at"], name: "index_metrics_on_calculated_at"
    t.index ["data"], name: "index_metrics_on_data", using: :gin
    t.index ["metadata"], name: "index_metrics_on_metadata", using: :gin
    t.index ["metric_type"], name: "index_metrics_on_metric_type"
    t.index ["period"], name: "index_metrics_on_period"
    t.index ["period_date"], name: "index_metrics_on_period_date"
    t.index ["trackable_type", "trackable_id", "metric_type", "period", "period_date"], name: "index_metrics_on_trackable_and_type_and_period", unique: true
    t.index ["trackable_type", "trackable_id"], name: "index_metrics_on_trackable"
    t.check_constraint "metric_type::text = ANY (ARRAY['hours_logged'::character varying::text, 'invoice_summary'::character varying::text, 'project_stats'::character varying::text, 'client_revenue'::character varying::text, 'team_utilization'::character varying::text, 'outstanding_amounts'::character varying::text, 'overdue_amounts'::character varying::text, 'timesheet_summary'::character varying::text])", name: "valid_metric_type"
    t.check_constraint "period::text = ANY (ARRAY['hour'::character varying::text, 'day'::character varying::text, 'week'::character varying::text, 'month'::character varying::text, 'quarter'::character varying::text, 'year'::character varying::text, 'all_time'::character varying::text])", name: "valid_period"
  end

  create_table "notification_preferences", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.boolean "invoice_email_notifications", default: true, null: false
    t.boolean "monthly_report_digest_enabled", default: false, null: false
    t.boolean "notification_enabled", default: false, null: false
    t.boolean "payment_email_notifications", default: true, null: false
    t.boolean "timesheet_reminder_enabled", default: true, null: false
    t.boolean "unsubscribed_from_all", default: false, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.date "weekly_reminder_last_sent_for_week_start"
    t.index ["company_id"], name: "index_notification_preferences_on_company_id"
    t.index ["user_id", "company_id"], name: "index_notification_preferences_on_user_id_and_company_id", unique: true
    t.index ["user_id"], name: "index_notification_preferences_on_user_id"
  end

  create_table "passkeys", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "external_id", null: false
    t.datetime "last_used_at"
    t.string "nickname"
    t.text "public_key", null: false
    t.bigint "sign_count", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["external_id"], name: "index_passkeys_on_external_id", unique: true
    t.index ["user_id"], name: "index_passkeys_on_user_id"
  end

  create_table "payments", force: :cascade do |t|
    t.decimal "amount", precision: 20, scale: 2, default: "0.0"
    t.decimal "base_currency_amount", precision: 20, scale: 2
    t.datetime "created_at", null: false
    t.decimal "exchange_rate", precision: 18, scale: 10
    t.date "exchange_rate_date"
    t.bigint "invoice_id", null: false
    t.string "name"
    t.text "note"
    t.string "payment_currency"
    t.string "provider_event_id"
    t.integer "status", null: false
    t.date "transaction_date", null: false
    t.integer "transaction_type", null: false
    t.datetime "updated_at", null: false
    t.index ["invoice_id", "transaction_date", "status"], name: "index_payments_on_invoice_transaction_date_status"
    t.index ["invoice_id"], name: "index_payments_on_invoice_id"
    t.index ["provider_event_id"], name: "index_payments_on_provider_event_id", unique: true
    t.index ["status"], name: "index_payments_on_status"
    t.index ["transaction_date"], name: "index_payments_on_transaction_date"
  end

  create_table "payments_providers", force: :cascade do |t|
    t.string "accepted_payment_methods", default: [], array: true
    t.bigint "company_id", null: false
    t.boolean "connected", default: false
    t.datetime "created_at", null: false
    t.boolean "enabled", default: false
    t.string "name", null: false
    t.jsonb "settings", default: {}, null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_payments_providers_on_company_id"
    t.index ["connected"], name: "index_payments_providers_on_connected"
    t.index ["enabled"], name: "index_payments_providers_on_enabled"
    t.index ["name", "company_id"], name: "index_payments_providers_on_name_and_company_id", unique: true
  end

  create_table "payroll_approvals", force: :cascade do |t|
    t.bigint "actor_id", null: false
    t.datetime "created_at", null: false
    t.bigint "payroll_revision_id", null: false
    t.string "stage", null: false
    t.datetime "updated_at", null: false
    t.index ["actor_id"], name: "index_payroll_approvals_on_actor_id"
    t.index ["payroll_revision_id", "stage"], name: "index_payroll_approvals_on_payroll_revision_id_and_stage", unique: true
    t.index ["payroll_revision_id"], name: "index_payroll_approvals_on_payroll_revision_id"
    t.check_constraint "stage::text = ANY (ARRAY['accounts'::character varying, 'final'::character varying]::text[])", name: "payroll_approval_stage"
  end

  create_table "payroll_revisions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.string "digest", null: false
    t.string "idempotency_key", null: false
    t.integer "number", null: false
    t.string "parent_digest"
    t.jsonb "payroll_payload", null: false
    t.bigint "payroll_run_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_payroll_revisions_on_created_by_id"
    t.index ["payroll_run_id", "idempotency_key"], name: "index_payroll_revisions_on_payroll_run_id_and_idempotency_key", unique: true
    t.index ["payroll_run_id", "number"], name: "index_payroll_revisions_on_payroll_run_id_and_number", unique: true
    t.index ["payroll_run_id"], name: "index_payroll_revisions_on_payroll_run_id"
    t.check_constraint "number > 0", name: "payroll_revision_positive_number"
  end

  create_table "payroll_runs", force: :cascade do |t|
    t.bigint "accounts_reviewer_id", null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "currency", null: false
    t.boolean "dry_run", default: true, null: false
    t.bigint "final_reviewer_id", null: false
    t.date "period", null: false
    t.datetime "updated_at", null: false
    t.index ["accounts_reviewer_id"], name: "index_payroll_runs_on_accounts_reviewer_id"
    t.index ["company_id", "period", "currency"], name: "index_payroll_runs_on_company_id_and_period_and_currency", unique: true
    t.index ["company_id"], name: "index_payroll_runs_on_company_id"
    t.index ["final_reviewer_id"], name: "index_payroll_runs_on_final_reviewer_id"
    t.check_constraint "EXTRACT(day FROM period) = 1::numeric", name: "payroll_run_month_start"
    t.check_constraint "accounts_reviewer_id <> final_reviewer_id", name: "payroll_distinct_reviewers"
    t.check_constraint "currency::text ~ '^[A-Z]{3}$'::text", name: "payroll_run_currency"
    t.check_constraint "dry_run = true", name: "payroll_run_dry_run_only"
  end

  create_table "previous_employments", force: :cascade do |t|
    t.string "company_name"
    t.datetime "created_at", null: false
    t.string "role"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_previous_employments_on_user_id"
  end

  create_table "profitability_billing_rates", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.bigint "user_id", null: false
    t.date "effective_on", null: false
    t.decimal "hourly_rate", precision: 14, scale: 4
    t.string "currency", null: false
    t.string "billing_method", default: "hourly", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id", "user_id", "effective_on"], name: "index_profitability_rates_effective"
    t.index ["project_id"], name: "index_profitability_billing_rates_on_project_id"
    t.index ["user_id"], name: "index_profitability_billing_rates_on_user_id"
    t.check_constraint "billing_method::text = 'hourly'::text AND hourly_rate >= 0::numeric OR billing_method::text = 'fixed_fee'::text AND hourly_rate IS NULL", name: "profitability_valid_billing_rate"
  end

  create_table "profitability_profiles", force: :cascade do |t|
    t.bigint "employment_id", null: false
    t.bigint "primary_project_id"
    t.string "department"
    t.integer "weekdays", default: [], null: false, array: true
    t.decimal "hours_per_day", precision: 4, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["employment_id"], name: "index_profitability_profiles_on_employment_id", unique: true
    t.index ["primary_project_id"], name: "index_profitability_profiles_on_primary_project_id"
  end

  create_table "project_members", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "discarded_at"
    t.decimal "hourly_rate", default: "0.0", null: false
    t.bigint "project_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["discarded_at"], name: "index_project_members_on_discarded_at"
    t.index ["project_id"], name: "index_project_members_on_project_id"
    t.index ["user_id"], name: "index_project_members_on_user_id"
  end

  create_table "projects", force: :cascade do |t|
    t.boolean "billable", null: false
    t.bigint "client_id", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "discarded_at"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["billable"], name: "index_projects_on_billable"
    t.index ["client_id"], name: "index_projects_on_client_id"
    t.index ["description"], name: "index_projects_on_description_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["discarded_at"], name: "index_projects_on_discarded_at"
    t.index ["name", "client_id"], name: "index_projects_on_name_and_client_id", unique: true
    t.index ["name"], name: "index_projects_on_name_trgm", opclass: :gin_trgm_ops, using: :gin
  end

  create_table "quickbooks_connections", force: :cascade do |t|
    t.text "access_token_ciphertext"
    t.datetime "access_token_expires_at"
    t.bigint "company_id", null: false
    t.datetime "connected_at"
    t.datetime "created_at", null: false
    t.datetime "disconnected_at"
    t.integer "environment", default: 0, null: false
    t.datetime "last_refresh_at"
    t.datetime "last_successful_sync_at"
    t.string "realm_id"
    t.text "refresh_token_ciphertext"
    t.datetime "refresh_token_expires_at"
    t.jsonb "settings", default: {}, null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "environment"], name: "idx_qbo_connections_active_company_environment", unique: true, where: "(disconnected_at IS NULL)"
    t.index ["company_id"], name: "index_quickbooks_connections_on_company_id"
    t.index ["id", "company_id"], name: "idx_qbo_connections_id_company", unique: true
    t.index ["realm_id", "environment"], name: "idx_qbo_connections_active_realm_environment", unique: true, where: "((realm_id IS NOT NULL) AND (disconnected_at IS NULL))"
  end

  create_table "quickbooks_references", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.integer "direction", default: 2, null: false
    t.text "last_error"
    t.datetime "last_seen_in_quickbooks_at"
    t.datetime "last_synced_at"
    t.bigint "miru_record_id", null: false
    t.string "miru_record_type", null: false
    t.string "payload_digest"
    t.bigint "quickbooks_connection_id", null: false
    t.string "quickbooks_entity_id", null: false
    t.string "quickbooks_entity_type", null: false
    t.string "quickbooks_sync_token"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_quickbooks_references_on_company_id"
    t.index ["quickbooks_connection_id", "miru_record_type", "miru_record_id", "quickbooks_entity_type"], name: "idx_qbo_refs_miru_record_entity", unique: true
    t.index ["quickbooks_connection_id", "quickbooks_entity_type", "quickbooks_entity_id"], name: "idx_qbo_refs_qbo_entity", unique: true
    t.index ["quickbooks_connection_id"], name: "index_quickbooks_references_on_quickbooks_connection_id"
  end

  create_table "quickbooks_sync_events", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.text "error"
    t.datetime "event_time"
    t.string "operation"
    t.string "payload_digest", null: false
    t.bigint "quickbooks_connection_id", null: false
    t.string "quickbooks_entity_id", null: false
    t.string "quickbooks_entity_type", null: false
    t.bigint "quickbooks_sync_run_id"
    t.integer "source", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "status"], name: "index_quickbooks_sync_events_on_company_id_and_status"
    t.index ["company_id"], name: "index_quickbooks_sync_events_on_company_id"
    t.index ["quickbooks_connection_id", "quickbooks_entity_type", "quickbooks_entity_id", "payload_digest"], name: "idx_qbo_events_idempotency", unique: true, where: "(status = 1)"
    t.index ["quickbooks_connection_id"], name: "index_quickbooks_sync_events_on_quickbooks_connection_id"
    t.index ["quickbooks_sync_run_id"], name: "index_quickbooks_sync_events_on_quickbooks_sync_run_id"
  end

  create_table "quickbooks_sync_runs", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.integer "direction", default: 2, null: false
    t.text "error"
    t.datetime "finished_at"
    t.bigint "quickbooks_connection_id", null: false
    t.datetime "started_at"
    t.integer "status", default: 0, null: false
    t.jsonb "summary", default: {}, null: false
    t.integer "trigger", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "status"], name: "index_quickbooks_sync_runs_on_company_id_and_status"
    t.index ["company_id"], name: "index_quickbooks_sync_runs_on_company_id"
    t.index ["id", "quickbooks_connection_id", "company_id"], name: "idx_qbo_runs_id_connection_company", unique: true
    t.index ["quickbooks_connection_id", "created_at"], name: "idx_on_quickbooks_connection_id_created_at_fbda7af87c"
    t.index ["quickbooks_connection_id"], name: "index_quickbooks_sync_runs_on_quickbooks_connection_id"
  end

  create_table "rails_event_viewer_entries", force: :cascade do |t|
    t.jsonb "context", default: {}
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "occurred_at", null: false
    t.jsonb "payload", default: {}
    t.string "source_file"
    t.string "source_label"
    t.integer "source_line"
    t.jsonb "tags", default: {}
    t.datetime "updated_at", null: false
    t.index ["context"], name: "index_rails_event_viewer_entries_on_context", using: :gin
    t.index ["name", "occurred_at"], name: "index_rails_event_viewer_entries_on_name_and_occurred_at"
    t.index ["name"], name: "index_rails_event_viewer_entries_on_name"
    t.index ["occurred_at"], name: "index_rails_event_viewer_entries_on_occurred_at"
    t.index ["tags"], name: "index_rails_event_viewer_entries_on_tags", using: :gin
  end

  create_table "razorpay_payouts", force: :cascade do |t|
    t.decimal "amount", precision: 20, scale: 2, null: false
    t.datetime "created_at", null: false
    t.string "currency", default: "INR", null: false
    t.string "external_id"
    t.text "failure_reason"
    t.string "idempotency_key", null: false
    t.string "mode", default: "UPI", null: false
    t.bigint "payment_id", null: false
    t.datetime "processed_at"
    t.jsonb "raw_response", default: {}, null: false
    t.string "recipient_email"
    t.string "recipient_name"
    t.string "recipient_phone"
    t.string "recipient_upi_id", null: false
    t.string "reference_id", null: false
    t.bigint "requested_by_id"
    t.integer "status", default: 0, null: false
    t.integer "triggered_by", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["external_id"], name: "index_razorpay_payouts_on_external_id", unique: true, where: "(external_id IS NOT NULL)"
    t.index ["idempotency_key"], name: "index_razorpay_payouts_on_idempotency_key", unique: true
    t.index ["payment_id", "status"], name: "index_razorpay_payouts_on_payment_id_and_status"
    t.index ["payment_id"], name: "index_razorpay_payouts_on_payment_id"
    t.index ["reference_id"], name: "index_razorpay_payouts_on_reference_id", unique: true
    t.index ["requested_by_id"], name: "index_razorpay_payouts_on_requested_by_id"
  end

  create_table "roles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.bigint "resource_id"
    t.string "resource_type"
    t.datetime "updated_at", null: false
    t.index ["name", "resource_type", "resource_id"], name: "index_roles_on_name_and_resource_type_and_resource_id"
    t.index ["resource_type", "resource_id"], name: "index_roles_on_resource"
  end

  create_table "salary_slips", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "employment_id", null: false
    t.date "pay_month", null: false
    t.datetime "published_at"
    t.bigint "published_by_id"
    t.string "source", null: false
    t.bigint "supersedes_id"
    t.datetime "updated_at", null: false
    t.bigint "uploaded_by_id", null: false
    t.datetime "withdrawn_at"
    t.bigint "withdrawn_by_id"
    t.index ["employment_id", "pay_month"], name: "index_salary_slips_current_publication", unique: true, where: "((published_at IS NOT NULL) AND (withdrawn_at IS NULL))"
    t.index ["employment_id"], name: "index_salary_slips_on_employment_id"
    t.index ["published_by_id"], name: "index_salary_slips_on_published_by_id"
    t.index ["supersedes_id"], name: "index_salary_slips_on_supersedes_id"
    t.index ["uploaded_by_id"], name: "index_salary_slips_on_uploaded_by_id"
    t.index ["withdrawn_by_id"], name: "index_salary_slips_on_withdrawn_by_id"
    t.check_constraint "EXTRACT(day FROM pay_month) = 1::numeric", name: "salary_slips_month_start"
  end

  create_table "second_factor_challenges", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.datetime "expires_at", null: false
    t.index ["user_id"], name: "index_second_factor_challenges_on_user_id"
  end

  create_table "signature_callbacks", force: :cascade do |t|
    t.bigint "revision_id", null: false
    t.string "digest", limit: 64, null: false
    t.string "event", limit: 40, null: false
    t.datetime "enqueued_at"
    t.datetime "processed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["revision_id", "digest"], name: "index_signature_callbacks_on_revision_id_and_digest", unique: true
    t.index ["revision_id"], name: "index_signature_callbacks_on_revision_id"
  end

  create_table "signature_connections", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "created_by_id", null: false
    t.text "api_key", null: false
    t.string "provider_origin", limit: 500, null: false
    t.datetime "disabled_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_signature_connections_active_company", unique: true, where: "(disabled_at IS NULL)"
    t.index ["company_id"], name: "index_signature_connections_on_company_id"
    t.index ["created_by_id"], name: "index_signature_connections_on_created_by_id"
  end

  create_table "signature_operations", force: :cascade do |t|
    t.bigint "revision_id", null: false
    t.bigint "requested_by_id", null: false
    t.string "key", limit: 36, null: false
    t.string "kind", null: false
    t.string "state", default: "queued", null: false
    t.string "phase", default: "preparing", null: false
    t.string "run_token", limit: 36
    t.string "provider_candidate", limit: 200
    t.string "error_code"
    t.boolean "automatic", default: false, null: false
    t.datetime "finished_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_signature_operations_on_key", unique: true
    t.index ["requested_by_id"], name: "index_signature_operations_on_requested_by_id"
    t.index ["revision_id", "kind"], name: "index_signature_operations_single_send", unique: true, where: "((kind)::text = 'send'::text)"
    t.index ["revision_id"], name: "index_signature_operations_on_revision_id"
    t.check_constraint "kind::text = ANY (ARRAY['send'::character varying, 'cancel'::character varying, 'remind'::character varying, 'refresh'::character varying]::text[])", name: "signature_operations_kind"
    t.check_constraint "phase::text = ANY (ARRAY['preparing'::character varying, 'creating'::character varying, 'verifying'::character varying, 'distributing'::character varying, 'cancelling'::character varying, 'reminding'::character varying, 'checking'::character varying]::text[])", name: "signature_operations_phase"
    t.check_constraint "state::text = ANY (ARRAY['queued'::character varying, 'running'::character varying, 'waiting'::character varying, 'confirmed'::character varying, 'failed'::character varying, 'uncertain'::character varying]::text[])", name: "signature_operations_state"
  end

  create_table "signature_request_revisions", force: :cascade do |t|
    t.bigint "signature_request_id", null: false
    t.bigint "created_by_id", null: false
    t.bigint "approved_by_id"
    t.integer "number", null: false
    t.string "title", limit: 200, null: false
    t.text "documents", null: false
    t.text "recipients", null: false
    t.text "fields", null: false
    t.string "content_digest", limit: 64, null: false
    t.string "status", default: "draft", null: false
    t.datetime "approved_at"
    t.string "provider_envelope_id"
    t.string "operation_id"
    t.datetime "send_started_at"
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "approval_digest", limit: 64
    t.string "approval_source"
    t.text "approval_note"
    t.text "signing_options"
    t.bigint "signature_connection_id"
    t.string "provider_status"
    t.datetime "provider_checked_at"
    t.text "recipient_statuses"
    t.datetime "cancel_requested_at"
    t.datetime "last_reminder_at"
    t.datetime "next_reminder_at"
    t.integer "automatic_reminders_count", default: 0, null: false
    t.text "artifact_manifest"
    t.datetime "archived_at"
    t.string "archive_error"
    t.index ["approved_by_id"], name: "index_signature_request_revisions_on_approved_by_id"
    t.index ["created_by_id"], name: "index_signature_request_revisions_on_created_by_id"
    t.index ["next_reminder_at"], name: "index_signature_request_revisions_on_next_reminder_at", where: "(next_reminder_at IS NOT NULL)"
    t.index ["operation_id"], name: "index_signature_request_revisions_on_operation_id", unique: true
    t.index ["provider_envelope_id"], name: "index_signature_request_revisions_on_provider_envelope_id", unique: true
    t.index ["signature_connection_id"], name: "index_signature_request_revisions_on_signature_connection_id"
    t.index ["signature_request_id", "number"], name: "idx_on_signature_request_id_number_f9b90d1824", unique: true
    t.index ["signature_request_id"], name: "index_signature_request_revisions_on_signature_request_id"
    t.check_constraint "automatic_reminders_count >= 0 AND automatic_reminders_count <= 3", name: "signature_revisions_reminder_count"
    t.check_constraint "number > 0", name: "signature_request_revisions_number"
    t.check_constraint "status::text = ANY (ARRAY['draft'::character varying, 'under_review'::character varying, 'changes_requested'::character varying, 'approved'::character varying, 'sending'::character varying, 'send_uncertain'::character varying, 'awaiting_signatures'::character varying, 'signed'::character varying, 'declined'::character varying, 'cancelled'::character varying, 'expired'::character varying]::text[])", name: "signature_request_revisions_status"
  end

  create_table "signature_requests", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "created_by_id", null: false
    t.bigint "client_id"
    t.bigint "employment_id"
    t.string "title", limit: 200, null: false
    t.string "creation_key", limit: 64, null: false
    t.string "creation_digest", limit: 64, null: false
    t.bigint "current_revision_id"
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["client_id"], name: "index_signature_requests_on_client_id"
    t.index ["company_id", "creation_key"], name: "index_signature_requests_on_company_id_and_creation_key", unique: true
    t.index ["company_id"], name: "index_signature_requests_on_company_id"
    t.index ["created_by_id"], name: "index_signature_requests_on_created_by_id"
    t.index ["current_revision_id"], name: "index_signature_requests_on_current_revision_id"
    t.index ["employment_id"], name: "index_signature_requests_on_employment_id"
    t.check_constraint "client_id IS NULL OR employment_id IS NULL", name: "signature_requests_party"
  end

  create_table "signature_review_comments", force: :cascade do |t|
    t.bigint "revision_id", null: false
    t.bigint "author_user_id"
    t.bigint "author_invitation_id"
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_invitation_id"], name: "index_signature_review_comments_on_author_invitation_id"
    t.index ["author_user_id"], name: "index_signature_review_comments_on_author_user_id"
    t.index ["revision_id"], name: "index_signature_review_comments_on_revision_id"
    t.check_constraint "(author_user_id IS NULL) <> (author_invitation_id IS NULL)", name: "signature_review_comments_author"
  end

  create_table "signature_review_invitations", force: :cascade do |t|
    t.bigint "revision_id", null: false
    t.bigint "invited_by_id", null: false
    t.string "recipient_id", limit: 64, null: false
    t.text "access_token", null: false
    t.datetime "expires_at", null: false
    t.datetime "revoked_at"
    t.string "decision"
    t.datetime "decided_at"
    t.string "email_status", default: "queued", null: false
    t.datetime "email_sent_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["access_token"], name: "index_signature_review_invitations_on_access_token", unique: true
    t.index ["invited_by_id"], name: "index_signature_review_invitations_on_invited_by_id"
    t.index ["revision_id", "recipient_id"], name: "signature_review_invitations_active_recipient", unique: true, where: "(revoked_at IS NULL)"
    t.index ["revision_id"], name: "index_signature_review_invitations_on_revision_id"
    t.check_constraint "decision IS NULL OR (decision::text = ANY (ARRAY['approved'::character varying, 'changes_requested'::character varying]::text[]))", name: "signature_review_invitations_decision"
    t.check_constraint "email_status::text = ANY (ARRAY['queued'::character varying, 'sent'::character varying, 'failed'::character varying]::text[])", name: "signature_review_invitations_email_status"
  end

  create_table "solid_cable_messages", force: :cascade do |t|
    t.binary "channel", null: false
    t.bigint "channel_hash", null: false
    t.datetime "created_at", null: false
    t.binary "payload", null: false
    t.index ["channel"], name: "index_solid_cable_messages_on_channel"
    t.index ["channel_hash"], name: "index_solid_cable_messages_on_channel_hash"
    t.index ["created_at"], name: "index_solid_cable_messages_on_created_at"
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.string "concurrency_key", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "error"
    t.bigint "job_id", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "active_job_id"
    t.text "arguments"
    t.string "class_name", null: false
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "finished_at"
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at"
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "queue_name", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "hostname"
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.text "metadata"
    t.string "name", null: false
    t.integer "pid", null: false
    t.bigint "supervisor_id"
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.datetime "run_at", null: false
    t.string "task_key", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.text "arguments"
    t.string "class_name"
    t.string "command", limit: 2048
    t.datetime "created_at", null: false
    t.text "description"
    t.string "key", null: false
    t.integer "priority", default: 0
    t.string "queue_name"
    t.string "schedule", null: false
    t.boolean "static", default: true, null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.integer "value", default: 1, null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "stripe_connected_accounts", force: :cascade do |t|
    t.string "account_id", null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_stripe_connected_accounts_on_account_id", unique: true
    t.index ["company_id"], name: "index_stripe_connected_accounts_on_company_id", unique: true
  end

  create_table "tax_configurations", force: :cascade do |t|
    t.integer "calculation_method", default: 0, null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "discarded_at"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.decimal "value", precision: 20, scale: 4, default: "0.0", null: false
    t.index ["company_id", "name"], name: "index_tax_configurations_on_company_id_and_name"
    t.index ["company_id"], name: "index_tax_configurations_on_company_id"
    t.index ["discarded_at"], name: "index_tax_configurations_on_discarded_at"
  end

  create_table "tax_declarations", force: :cascade do |t|
    t.decimal "approved_amount", precision: 12, scale: 2
    t.string "category", null: false
    t.decimal "claimed_amount", precision: 12, scale: 2, null: false
    t.datetime "created_at", null: false
    t.bigint "employment_id", null: false
    t.text "notes"
    t.text "review_reason"
    t.datetime "reviewed_at"
    t.bigint "reviewed_by_id"
    t.string "status", default: "draft", null: false
    t.datetime "submitted_at"
    t.bigint "supersedes_id"
    t.integer "tax_year", null: false
    t.datetime "updated_at", null: false
    t.datetime "withdrawn_at"
    t.bigint "withdrawn_by_id"
    t.index ["employment_id", "tax_year"], name: "index_tax_declarations_on_employment_id_and_tax_year"
    t.index ["employment_id"], name: "index_tax_declarations_on_employment_id"
    t.index ["reviewed_by_id"], name: "index_tax_declarations_on_reviewed_by_id"
    t.index ["supersedes_id"], name: "index_tax_declarations_on_supersedes_id", unique: true
    t.index ["withdrawn_by_id"], name: "index_tax_declarations_on_withdrawn_by_id"
    t.check_constraint "approved_amount IS NULL OR approved_amount > 0::numeric AND approved_amount <= claimed_amount", name: "tax_declarations_approved_limit"
    t.check_constraint "claimed_amount > 0::numeric", name: "tax_declarations_positive_claim"
  end

  create_table "timeoff_entries", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "custom_leave_id"
    t.datetime "discarded_at"
    t.integer "duration", null: false
    t.bigint "holiday_info_id"
    t.date "leave_date", null: false
    t.bigint "leave_type_id"
    t.text "note", default: ""
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["custom_leave_id"], name: "index_timeoff_entries_on_custom_leave_id"
    t.index ["discarded_at"], name: "index_timeoff_entries_on_discarded_at"
    t.index ["holiday_info_id"], name: "index_timeoff_entries_on_holiday_info_id"
    t.index ["leave_type_id"], name: "index_timeoff_entries_on_leave_type_id"
    t.index ["user_id"], name: "index_timeoff_entries_on_user_id"
  end

  create_table "timesheet_entries", force: :cascade do |t|
    t.bigint "agent_id"
    t.integer "bill_status", null: false
    t.datetime "created_at", null: false
    t.datetime "discarded_at"
    t.float "duration", null: false
    t.string "external_run_id"
    t.string "external_session_id"
    t.boolean "locked", default: false
    t.text "note", default: ""
    t.bigint "project_id", null: false
    t.jsonb "proof_metadata", default: {}, null: false
    t.text "proof_url"
    t.integer "review_status", default: 0, null: false
    t.string "source", default: "manual", null: false
    t.jsonb "source_metadata", default: {}, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.date "work_date", null: false
    t.index ["agent_id", "review_status"], name: "index_timesheet_entries_on_agent_id_and_review_status"
    t.index ["agent_id"], name: "index_timesheet_entries_on_agent_id"
    t.index ["bill_status"], name: "index_timesheet_entries_on_bill_status"
    t.index ["discarded_at"], name: "index_timesheet_entries_on_discarded_at"
    t.index ["note"], name: "index_timesheet_entries_on_note_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["project_id", "work_date"], name: "index_timesheet_entries_on_project_work_date"
    t.index ["project_id"], name: "index_timesheet_entries_on_project_id"
    t.index ["review_status", "bill_status"], name: "index_timesheet_entries_on_review_status_and_bill_status"
    t.index ["review_status"], name: "index_timesheet_entries_on_review_status"
    t.index ["source"], name: "index_timesheet_entries_on_source"
    t.index ["user_id", "work_date", "bill_status"], name: "index_timesheet_entries_on_user_work_date_bill_status"
    t.index ["user_id", "work_date"], name: "index_timesheet_entries_on_user_id_and_work_date"
    t.index ["user_id"], name: "index_timesheet_entries_on_user_id"
    t.index ["work_date"], name: "index_timesheet_entries_on_work_date"
  end

  create_table "users", force: :cascade do |t|
    t.boolean "calendar_connected", default: true
    t.boolean "calendar_enabled", default: true
    t.datetime "confirmation_sent_at"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "created_at", null: false
    t.datetime "current_sign_in_at"
    t.string "current_sign_in_ip"
    t.bigint "current_workspace_id"
    t.date "date_of_birth"
    t.datetime "discarded_at"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.integer "failed_attempts", default: 0, null: false
    t.string "first_name", null: false
    t.datetime "invitation_accepted_at"
    t.datetime "invitation_created_at"
    t.integer "invitation_limit"
    t.datetime "invitation_sent_at"
    t.string "invitation_token"
    t.integer "invitations_count", default: 0
    t.bigint "invited_by_id"
    t.string "invited_by_type"
    t.string "jti", null: false
    t.string "last_name", null: false
    t.datetime "last_sign_in_at"
    t.string "last_sign_in_ip"
    t.string "locale", default: "en", null: false
    t.datetime "locked_at"
    t.integer "otp_last_used_at"
    t.jsonb "otp_recovery_codes_digest", default: [], null: false
    t.datetime "otp_recovery_codes_generated_at"
    t.boolean "otp_required_for_login", default: false, null: false
    t.text "otp_secret_ciphertext"
    t.boolean "passkey_required_for_login", default: false, null: false
    t.datetime "password_changed_at"
    t.string "personal_email_id"
    t.string "phone"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "sign_in_count", default: 0, null: false
    t.jsonb "social_accounts"
    t.string "token", limit: 50
    t.string "unconfirmed_email"
    t.string "unique_session_id", null: false
    t.datetime "updated_at", null: false
    t.string "webauthn_id"
    t.integer "browser_trust_version", default: 0, null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token"
    t.index ["current_workspace_id"], name: "index_users_on_current_workspace_id"
    t.index ["discarded_at"], name: "index_users_on_discarded_at"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["email"], name: "index_users_on_email_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["first_name"], name: "index_users_on_first_name_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["invitation_token"], name: "index_users_on_invitation_token", unique: true
    t.index ["invited_by_type", "invited_by_id"], name: "index_users_on_invited_by_type_and_invited_by_id"
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["last_name"], name: "index_users_on_last_name_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["locale"], name: "index_users_on_locale"
    t.index ["locked_at"], name: "index_users_on_locked_at"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["unique_session_id"], name: "index_users_on_unique_session_id", unique: true
    t.index ["webauthn_id"], name: "index_users_on_webauthn_id", unique: true
  end

  create_table "users_roles", id: false, force: :cascade do |t|
    t.bigint "role_id"
    t.bigint "user_id"
    t.index ["role_id"], name: "index_users_roles_on_role_id"
    t.index ["user_id", "role_id"], name: "index_users_roles_on_user_id_and_role_id"
    t.index ["user_id"], name: "index_users_roles_on_user_id"
  end

  create_table "vendors", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_vendors_on_company_id"
  end

  create_table "wise_accounts", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "profile_id"
    t.string "recipient_id"
    t.string "source_currency"
    t.string "target_currency"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["company_id"], name: "index_wise_accounts_on_company_id"
    t.index ["user_id", "company_id"], name: "index_wise_accounts_on_user_id_and_company_id", unique: true
    t.index ["user_id"], name: "index_wise_accounts_on_user_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "agent_keys", "agents"
  add_foreign_key "agent_keys", "users", column: "created_by_id"
  add_foreign_key "agents", "companies"
  add_foreign_key "agents", "projects", column: "default_project_id"
  add_foreign_key "agents", "users"
  add_foreign_key "agreement_templates", "companies"
  add_foreign_key "agreement_templates", "users", column: "created_by_id"
  add_foreign_key "agreements", "agreement_templates"
  add_foreign_key "agreements", "clients"
  add_foreign_key "agreements", "companies"
  add_foreign_key "agreements", "employments"
  add_foreign_key "agreements", "users", column: "created_by_id"
  add_foreign_key "analytics_reports", "companies"
  add_foreign_key "analytics_reports", "users", column: "created_by_id"
  add_foreign_key "analytics_threshold_notification_logs", "companies"
  add_foreign_key "browser_sessions", "users"
  add_foreign_key "bulk_invoice_download_statuses", "companies", validate: false
  add_foreign_key "carryovers", "companies"
  add_foreign_key "carryovers", "leave_types"
  add_foreign_key "carryovers", "users"
  add_foreign_key "cli_sessions", "companies"
  add_foreign_key "cli_sessions", "users"
  add_foreign_key "client_members", "clients"
  add_foreign_key "client_members", "companies"
  add_foreign_key "client_members", "users"
  add_foreign_key "clients", "companies"
  add_foreign_key "compensation_report_runs", "companies"
  add_foreign_key "compensation_report_runs", "users", column: "created_by_id"
  add_foreign_key "compensation_versions", "employments"
  add_foreign_key "consultant_compensations", "employments"
  add_foreign_key "consultant_compensations", "users", column: "created_by_id"
  add_foreign_key "custom_leave_users", "custom_leaves", column: "custom_leave_id"
  add_foreign_key "custom_leave_users", "users"
  add_foreign_key "custom_leaves", "leaves", column: "leave_id"
  add_foreign_key "data_imports", "companies"
  add_foreign_key "data_imports", "users"
  add_foreign_key "desktop_current_timers", "companies"
  add_foreign_key "desktop_current_timers", "users"
  add_foreign_key "devices", "companies"
  add_foreign_key "devices", "users"
  add_foreign_key "employee_documents", "employments"
  add_foreign_key "employee_documents", "users", column: "uploaded_by_id"
  add_foreign_key "employee_occasion_deliveries", "employments"
  add_foreign_key "employee_occasion_deliveries", "users", column: "admin_id"
  add_foreign_key "employee_payments", "employments"
  add_foreign_key "employee_payments", "users", column: "created_by_id"
  add_foreign_key "employee_record_settings", "companies"
  add_foreign_key "employee_records", "employments"
  add_foreign_key "employee_reports", "companies"
  add_foreign_key "employments", "companies"
  add_foreign_key "employments", "users"
  add_foreign_key "expense_categories", "companies"
  add_foreign_key "expenses", "companies"
  add_foreign_key "expenses", "expense_categories"
  add_foreign_key "expenses", "projects"
  add_foreign_key "expenses", "users"
  add_foreign_key "expenses", "vendors"
  add_foreign_key "hiring_applications", "companies"
  add_foreign_key "hiring_applications", "employments", column: "owner_employment_id", on_delete: :nullify
  add_foreign_key "hiring_applications", "hiring_candidates", column: ["company_id", "hiring_candidate_id"], primary_key: ["company_id", "id"]
  add_foreign_key "hiring_applications", "hiring_roles", column: ["company_id", "hiring_role_id"], primary_key: ["company_id", "id"]
  add_foreign_key "hiring_applications", "users", column: "created_by_id", on_delete: :nullify
  add_foreign_key "hiring_candidates", "companies"
  add_foreign_key "hiring_mailboxes", "companies"
  add_foreign_key "hiring_messages", "companies"
  add_foreign_key "hiring_messages", "hiring_applications", column: ["company_id", "hiring_application_id"], primary_key: ["company_id", "id"]
  add_foreign_key "hiring_messages", "hiring_messages", column: ["company_id", "hiring_application_id", "original_message_id"], primary_key: ["company_id", "hiring_application_id", "id"], name: "hiring_message_original", on_delete: :cascade
  add_foreign_key "hiring_messages", "hiring_settings"
  add_foreign_key "hiring_messages", "hiring_settings", column: ["company_id", "hiring_setting_id"], primary_key: ["company_id", "id"]
  add_foreign_key "hiring_messages", "users", column: "queued_by_id", on_delete: :nullify
  add_foreign_key "hiring_messages", "users", column: "resolved_by_id", on_delete: :nullify
  add_foreign_key "hiring_portal_accesses", "companies"
  add_foreign_key "hiring_portal_accesses", "hiring_applications", column: ["company_id", "hiring_application_id"], primary_key: ["company_id", "id"]
  add_foreign_key "hiring_portal_accesses", "hiring_settings"
  add_foreign_key "hiring_portal_accesses", "hiring_settings", column: ["company_id", "hiring_setting_id"], primary_key: ["company_id", "id"]
  add_foreign_key "hiring_portal_accesses", "users", column: "issued_by_id", on_delete: :nullify
  add_foreign_key "hiring_receipts", "action_mailbox_inbound_emails", column: "inbound_email_id", on_delete: :nullify
  add_foreign_key "hiring_receipts", "companies"
  add_foreign_key "hiring_receipts", "hiring_applications", column: ["company_id", "hiring_application_id"], primary_key: ["company_id", "id"]
  add_foreign_key "hiring_receipts", "hiring_mailboxes", column: ["company_id", "hiring_mailbox_id"], primary_key: ["company_id", "id"]
  add_foreign_key "hiring_receipts", "users", column: "reviewed_by_id", on_delete: :nullify
  add_foreign_key "hiring_roles", "companies"
  add_foreign_key "hiring_screenings", "companies"
  add_foreign_key "hiring_screenings", "hiring_applications", column: ["company_id", "hiring_application_id"], primary_key: ["company_id", "id"]
  add_foreign_key "hiring_screenings", "users", column: "created_by_id", on_delete: :nullify
  add_foreign_key "hiring_settings", "companies"
  add_foreign_key "hiring_settings", "users", column: "approved_by_id", on_delete: :nullify
  add_foreign_key "hiring_submissions", "companies"
  add_foreign_key "hiring_submissions", "hiring_applications", column: ["company_id", "hiring_application_id"], primary_key: ["company_id", "id"]
  add_foreign_key "hiring_submissions", "hiring_portal_accesses", column: ["company_id", "hiring_application_id", "hiring_portal_access_id"], primary_key: ["company_id", "hiring_application_id", "id"], name: "fk_hiring_submission_application_access"
  add_foreign_key "holiday_infos", "holidays"
  add_foreign_key "holidays", "companies", validate: false
  add_foreign_key "identities", "users"
  add_foreign_key "invitations", "clients"
  add_foreign_key "invitations", "companies"
  add_foreign_key "invitations", "users", column: "sender_id"
  add_foreign_key "invoice_line_item_time_entries", "invoice_line_items"
  add_foreign_key "invoice_line_item_time_entries", "timesheet_entries"
  add_foreign_key "invoice_line_items", "invoices"
  add_foreign_key "invoice_line_items", "timesheet_entries"
  add_foreign_key "invoice_taxes", "invoices"
  add_foreign_key "invoice_taxes", "tax_configurations"
  add_foreign_key "invoices", "clients"
  add_foreign_key "invoices", "companies"
  add_foreign_key "leave_types", "leaves", column: "leave_id"
  add_foreign_key "leaves", "companies"
  add_foreign_key "notification_preferences", "companies"
  add_foreign_key "notification_preferences", "users"
  add_foreign_key "passkeys", "users"
  add_foreign_key "payments", "invoices"
  add_foreign_key "payments_providers", "companies"
  add_foreign_key "payroll_approvals", "payroll_revisions"
  add_foreign_key "payroll_approvals", "users", column: "actor_id"
  add_foreign_key "payroll_revisions", "payroll_runs"
  add_foreign_key "payroll_revisions", "users", column: "created_by_id"
  add_foreign_key "payroll_runs", "companies"
  add_foreign_key "payroll_runs", "users", column: "accounts_reviewer_id"
  add_foreign_key "payroll_runs", "users", column: "final_reviewer_id"
  add_foreign_key "previous_employments", "users"
  add_foreign_key "profitability_billing_rates", "projects"
  add_foreign_key "profitability_billing_rates", "users"
  add_foreign_key "profitability_profiles", "employments"
  add_foreign_key "profitability_profiles", "projects", column: "primary_project_id"
  add_foreign_key "project_members", "projects"
  add_foreign_key "project_members", "users"
  add_foreign_key "projects", "clients"
  add_foreign_key "quickbooks_connections", "companies"
  add_foreign_key "quickbooks_references", "companies"
  add_foreign_key "quickbooks_references", "quickbooks_connections"
  add_foreign_key "quickbooks_references", "quickbooks_connections", column: ["quickbooks_connection_id", "company_id"], primary_key: ["id", "company_id"], name: "fk_qbo_refs_connection_company"
  add_foreign_key "quickbooks_sync_events", "companies"
  add_foreign_key "quickbooks_sync_events", "quickbooks_connections"
  add_foreign_key "quickbooks_sync_events", "quickbooks_connections", column: ["quickbooks_connection_id", "company_id"], primary_key: ["id", "company_id"], name: "fk_qbo_events_connection_company"
  add_foreign_key "quickbooks_sync_events", "quickbooks_sync_runs"
  add_foreign_key "quickbooks_sync_events", "quickbooks_sync_runs", column: ["quickbooks_sync_run_id", "quickbooks_connection_id", "company_id"], primary_key: ["id", "quickbooks_connection_id", "company_id"], name: "fk_qbo_events_run_connection_company"
  add_foreign_key "quickbooks_sync_runs", "companies"
  add_foreign_key "quickbooks_sync_runs", "quickbooks_connections"
  add_foreign_key "quickbooks_sync_runs", "quickbooks_connections", column: ["quickbooks_connection_id", "company_id"], primary_key: ["id", "company_id"], name: "fk_qbo_runs_connection_company"
  add_foreign_key "razorpay_payouts", "payments"
  add_foreign_key "razorpay_payouts", "users", column: "requested_by_id"
  add_foreign_key "salary_slips", "employments"
  add_foreign_key "salary_slips", "salary_slips", column: "supersedes_id"
  add_foreign_key "salary_slips", "users", column: "published_by_id"
  add_foreign_key "salary_slips", "users", column: "uploaded_by_id"
  add_foreign_key "salary_slips", "users", column: "withdrawn_by_id"
  add_foreign_key "second_factor_challenges", "users"
  add_foreign_key "signature_callbacks", "signature_request_revisions", column: "revision_id"
  add_foreign_key "signature_connections", "companies"
  add_foreign_key "signature_connections", "users", column: "created_by_id"
  add_foreign_key "signature_operations", "signature_request_revisions", column: "revision_id"
  add_foreign_key "signature_operations", "users", column: "requested_by_id"
  add_foreign_key "signature_request_revisions", "signature_connections"
  add_foreign_key "signature_request_revisions", "signature_requests"
  add_foreign_key "signature_request_revisions", "users", column: "approved_by_id"
  add_foreign_key "signature_request_revisions", "users", column: "created_by_id"
  add_foreign_key "signature_requests", "clients"
  add_foreign_key "signature_requests", "companies"
  add_foreign_key "signature_requests", "employments"
  add_foreign_key "signature_requests", "signature_request_revisions", column: "current_revision_id"
  add_foreign_key "signature_requests", "users", column: "created_by_id"
  add_foreign_key "signature_review_comments", "signature_request_revisions", column: "revision_id"
  add_foreign_key "signature_review_comments", "signature_review_invitations", column: "author_invitation_id"
  add_foreign_key "signature_review_comments", "users", column: "author_user_id"
  add_foreign_key "signature_review_invitations", "signature_request_revisions", column: "revision_id"
  add_foreign_key "signature_review_invitations", "users", column: "invited_by_id"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "stripe_connected_accounts", "companies"
  add_foreign_key "tax_configurations", "companies"
  add_foreign_key "tax_declarations", "employments"
  add_foreign_key "tax_declarations", "tax_declarations", column: "supersedes_id"
  add_foreign_key "tax_declarations", "users", column: "reviewed_by_id"
  add_foreign_key "tax_declarations", "users", column: "withdrawn_by_id"
  add_foreign_key "timeoff_entries", "custom_leaves", column: "custom_leave_id"
  add_foreign_key "timeoff_entries", "leave_types"
  add_foreign_key "timeoff_entries", "users"
  add_foreign_key "timesheet_entries", "agents"
  add_foreign_key "timesheet_entries", "projects"
  add_foreign_key "timesheet_entries", "users"
  add_foreign_key "users", "companies", column: "current_workspace_id"
  add_foreign_key "vendors", "companies"
  add_foreign_key "wise_accounts", "companies"
  add_foreign_key "wise_accounts", "users"
  execute <<~SQL
    CREATE OR REPLACE FUNCTION protect_payroll_review_history() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'Payroll review history is immutable';
    END;
    $$;
  SQL
  execute <<~SQL
    CREATE TRIGGER payroll_runs_immutable BEFORE UPDATE OR DELETE ON payroll_runs
    FOR EACH ROW EXECUTE FUNCTION protect_payroll_review_history();
  SQL
  execute <<~SQL
    CREATE TRIGGER payroll_revisions_immutable BEFORE UPDATE OR DELETE ON payroll_revisions
    FOR EACH ROW EXECUTE FUNCTION protect_payroll_review_history();
  SQL
  execute <<~SQL
    CREATE TRIGGER payroll_approvals_immutable BEFORE UPDATE OR DELETE ON payroll_approvals
    FOR EACH ROW EXECUTE FUNCTION protect_payroll_review_history();
  SQL
end
