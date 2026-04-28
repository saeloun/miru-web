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

ActiveRecord::Schema[8.1].define(version: 2026_04_28_170000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pg_stat_statements"
  enable_extension "pg_trgm"
  enable_extension "unaccent"

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

  create_table "bulk_invoice_download_statuses", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "download_id"
    t.string "file_url"
    t.string "status"
    t.datetime "updated_at", null: false
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
    t.string "email"
    t.string "name", null: false
    t.string "phone"
    t.string "stripe_id"
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_clients_on_company_id"
    t.index ["discarded_at"], name: "index_clients_on_discarded_at"
    t.index ["email", "company_id"], name: "index_clients_on_email_and_company_id", unique: true
    t.index ["email"], name: "index_clients_on_email_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["name", "company_id"], name: "index_clients_on_name_and_company_id", unique: true
    t.index ["name"], name: "index_clients_on_name_trgm", opclass: :gin_trgm_ops, using: :gin
  end

  create_table "companies", force: :cascade do |t|
    t.text "address"
    t.string "bank_account_number"
    t.string "bank_name"
    t.string "bank_routing_number"
    t.string "bank_swift_code"
    t.string "base_currency", default: "USD", null: false
    t.boolean "billing_exempt", default: false, null: false
    t.string "business_phone"
    t.boolean "calendar_enabled", default: true
    t.string "country", null: false
    t.datetime "created_at", null: false
    t.string "date_format"
    t.string "ein"
    t.string "fiscal_year_end"
    t.string "gst_number"
    t.string "name", null: false
    t.string "plan_tier", default: "free", null: false
    t.decimal "standard_price", default: "0.0", null: false
    t.string "stripe_customer_id"
    t.string "stripe_subscription_id"
    t.datetime "subscription_ends_at"
    t.string "subscription_interval"
    t.string "subscription_status"
    t.string "tax_id"
    t.string "timezone"
    t.datetime "trial_ends_at"
    t.datetime "trial_started_at"
    t.datetime "updated_at", null: false
    t.string "us_taxpayer_id"
    t.string "vat_number"
    t.string "working_days", default: "5"
    t.string "working_hours", default: "40"
    t.index ["stripe_customer_id"], name: "index_companies_on_stripe_customer_id"
    t.index ["stripe_subscription_id"], name: "index_companies_on_stripe_subscription_id"
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
    t.string "category_name"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.text "description"
    t.datetime "discarded_at"
    t.bigint "expense_category_id"
    t.integer "expense_type"
    t.datetime "paid_at"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.bigint "vendor_id"
    t.string "vendor_name"
    t.index ["company_id"], name: "index_expenses_on_company_id"
    t.index ["date"], name: "index_expenses_on_date"
    t.index ["description"], name: "index_expenses_on_description_trgm", opclass: :gin_trgm_ops, using: :gin
    t.index ["discarded_at"], name: "index_expenses_on_discarded_at"
    t.index ["expense_category_id"], name: "index_expenses_on_expense_category_id"
    t.index ["expense_type"], name: "index_expenses_on_expense_type"
    t.index ["status"], name: "index_expenses_on_status"
    t.index ["user_id"], name: "index_expenses_on_user_id"
    t.index ["vendor_id"], name: "index_expenses_on_vendor_id"
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
    t.index ["timesheet_entry_id"], name: "index_invoice_line_items_on_timesheet_entry_id"
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
    t.index ["client_id"], name: "index_invoices_on_client_id"
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
    t.datetime "discarded_at"
    t.decimal "exchange_rate", precision: 18, scale: 10
    t.date "exchange_rate_date"
    t.bigint "invoice_id", null: false
    t.string "name"
    t.text "note"
    t.string "payment_currency"
    t.integer "status", null: false
    t.date "transaction_date", null: false
    t.integer "transaction_type", null: false
    t.datetime "updated_at", null: false
    t.index ["discarded_at"], name: "index_payments_on_discarded_at"
    t.index ["invoice_id"], name: "index_payments_on_invoice_id"
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
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_payments_providers_on_company_id"
    t.index ["connected"], name: "index_payments_providers_on_connected"
    t.index ["enabled"], name: "index_payments_providers_on_enabled"
    t.index ["name", "company_id"], name: "index_payments_providers_on_name_and_company_id", unique: true
  end

  create_table "previous_employments", force: :cascade do |t|
    t.string "company_name"
    t.datetime "created_at", null: false
    t.string "role"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_previous_employments_on_user_id"
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

  create_table "roles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.bigint "resource_id"
    t.string "resource_type"
    t.datetime "updated_at", null: false
    t.index ["name", "resource_type", "resource_id"], name: "index_roles_on_name_and_resource_type_and_resource_id"
    t.index ["resource_type", "resource_id"], name: "index_roles_on_resource"
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
    t.index ["project_id"], name: "index_timesheet_entries_on_project_id"
    t.index ["review_status", "bill_status"], name: "index_timesheet_entries_on_review_status_and_bill_status"
    t.index ["review_status"], name: "index_timesheet_entries_on_review_status"
    t.index ["source"], name: "index_timesheet_entries_on_source"
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
  add_foreign_key "carryovers", "companies"
  add_foreign_key "carryovers", "leave_types"
  add_foreign_key "carryovers", "users"
  add_foreign_key "cli_sessions", "companies"
  add_foreign_key "cli_sessions", "users"
  add_foreign_key "client_members", "clients"
  add_foreign_key "client_members", "companies"
  add_foreign_key "client_members", "users"
  add_foreign_key "clients", "companies"
  add_foreign_key "custom_leave_users", "custom_leaves", column: "custom_leave_id"
  add_foreign_key "custom_leave_users", "users"
  add_foreign_key "custom_leaves", "leaves", column: "leave_id"
  add_foreign_key "desktop_current_timers", "companies"
  add_foreign_key "desktop_current_timers", "users"
  add_foreign_key "devices", "companies"
  add_foreign_key "devices", "users"
  add_foreign_key "employments", "companies"
  add_foreign_key "employments", "users"
  add_foreign_key "expense_categories", "companies"
  add_foreign_key "expenses", "companies"
  add_foreign_key "expenses", "expense_categories"
  add_foreign_key "expenses", "users"
  add_foreign_key "expenses", "vendors"
  add_foreign_key "holiday_infos", "holidays"
  add_foreign_key "holidays", "companies", validate: false
  add_foreign_key "identities", "users"
  add_foreign_key "invitations", "clients"
  add_foreign_key "invitations", "companies"
  add_foreign_key "invitations", "users", column: "sender_id"
  add_foreign_key "invoice_line_items", "invoices"
  add_foreign_key "invoice_line_items", "timesheet_entries"
  add_foreign_key "invoices", "clients"
  add_foreign_key "invoices", "companies"
  add_foreign_key "leave_types", "leaves", column: "leave_id"
  add_foreign_key "leaves", "companies"
  add_foreign_key "notification_preferences", "companies"
  add_foreign_key "notification_preferences", "users"
  add_foreign_key "passkeys", "users"
  add_foreign_key "payments", "invoices"
  add_foreign_key "payments_providers", "companies"
  add_foreign_key "previous_employments", "users"
  add_foreign_key "project_members", "projects"
  add_foreign_key "project_members", "users"
  add_foreign_key "projects", "clients"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "stripe_connected_accounts", "companies"
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
end
