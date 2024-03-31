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

ActiveRecord::Schema[7.1].define(version: 2024_03_31_034308) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "addresses", force: :cascade do |t|
    t.string "addressable_type"
    t.bigint "addressable_id"
    t.string "address_type", default: "current"
    t.string "address_line_1", null: false
    t.string "address_line_2"
    t.string "city", null: false
    t.string "country", null: false
    t.string "pin", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "state", null: false
    t.index ["addressable_type", "addressable_id", "address_type"], name: "index_addresses_on_addressable_and_address_type", unique: true
    t.index ["addressable_type", "addressable_id"], name: "index_addresses_on_addressable"
  end

  create_table "ahoy_events", force: :cascade do |t|
    t.bigint "visit_id"
    t.bigint "user_id"
    t.string "name"
    t.jsonb "properties"
    t.datetime "time"
    t.index ["name", "time"], name: "index_ahoy_events_on_name_and_time"
    t.index ["properties"], name: "index_ahoy_events_on_properties", opclass: :jsonb_path_ops, using: :gin
    t.index ["user_id"], name: "index_ahoy_events_on_user_id"
    t.index ["visit_id"], name: "index_ahoy_events_on_visit_id"
  end

  create_table "ahoy_visits", force: :cascade do |t|
    t.string "visit_token"
    t.string "visitor_token"
    t.bigint "user_id"
    t.string "ip"
    t.text "user_agent"
    t.text "referrer"
    t.string "referring_domain"
    t.text "landing_page"
    t.string "browser"
    t.string "os"
    t.string "device_type"
    t.string "country"
    t.string "region"
    t.string "city"
    t.float "latitude"
    t.float "longitude"
    t.string "utm_source"
    t.string "utm_medium"
    t.string "utm_term"
    t.string "utm_content"
    t.string "utm_campaign"
    t.string "app_version"
    t.string "os_version"
    t.string "platform"
    t.datetime "started_at"
    t.index ["user_id"], name: "index_ahoy_visits_on_user_id"
    t.index ["visit_token"], name: "index_ahoy_visits_on_visit_token", unique: true
  end

  create_table "client_members", force: :cascade do |t|
    t.bigint "client_id", null: false
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "company_id", null: false
    t.datetime "discarded_at"
    t.index ["client_id", "user_id"], name: "index_client_members_on_client_id_and_user_id", unique: true
    t.index ["client_id"], name: "index_client_members_on_client_id"
    t.index ["company_id"], name: "index_client_members_on_company_id"
    t.index ["discarded_at"], name: "index_client_members_on_discarded_at"
    t.index ["user_id"], name: "index_client_members_on_user_id"
  end

  create_table "clients", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "name", null: false
    t.string "email"
    t.string "phone"
    t.string "address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.string "stripe_id"
    t.index ["company_id"], name: "index_clients_on_company_id"
    t.index ["discarded_at"], name: "index_clients_on_discarded_at"
    t.index ["email", "company_id"], name: "index_clients_on_email_and_company_id", unique: true
    t.index ["name", "company_id"], name: "index_clients_on_name_and_company_id", unique: true
  end

  create_table "companies", force: :cascade do |t|
    t.string "name", null: false
    t.text "address"
    t.string "business_phone"
    t.string "base_currency", default: "USD", null: false
    t.decimal "standard_price", default: "0.0", null: false
    t.string "fiscal_year_end"
    t.string "date_format"
    t.string "country", null: false
    t.string "timezone"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "calendar_enabled", default: true
  end

  create_table "data_migrations", primary_key: "version", id: :string, force: :cascade do |t|
  end

  create_table "devices", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "company_id", null: false
    t.string "device_type", default: "laptop"
    t.string "name"
    t.string "serial_number"
    t.jsonb "specifications"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_devices_on_company_id"
    t.index ["device_type"], name: "index_devices_on_device_type"
    t.index ["user_id"], name: "index_devices_on_user_id"
  end

  create_table "employments", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.string "employee_id"
    t.string "designation"
    t.string "employment_type"
    t.date "joined_at"
    t.date "resigned_at"
    t.index ["company_id"], name: "index_employments_on_company_id"
    t.index ["discarded_at"], name: "index_employments_on_discarded_at"
    t.index ["user_id"], name: "index_employments_on_user_id"
  end

  create_table "expense_categories", force: :cascade do |t|
    t.string "name"
    t.boolean "default", default: false
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_expense_categories_on_company_id"
  end

  create_table "expenses", force: :cascade do |t|
    t.date "date", null: false
    t.decimal "amount", precision: 20, scale: 2, default: "0.0", null: false
    t.integer "expense_type"
    t.text "description"
    t.bigint "company_id", null: false
    t.bigint "expense_category_id", null: false
    t.bigint "vendor_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_expenses_on_company_id"
    t.index ["expense_category_id"], name: "index_expenses_on_expense_category_id"
    t.index ["expense_type"], name: "index_expenses_on_expense_type"
    t.index ["vendor_id"], name: "index_expenses_on_vendor_id"
  end

  create_table "holiday_infos", force: :cascade do |t|
    t.date "date", null: false
    t.string "name", null: false
    t.bigint "holiday_id", null: false
    t.integer "category", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.index ["discarded_at"], name: "index_holiday_infos_on_discarded_at"
    t.index ["holiday_id"], name: "index_holiday_infos_on_holiday_id"
  end

  create_table "holidays", force: :cascade do |t|
    t.integer "year", null: false
    t.boolean "enable_optional_holidays", default: false
    t.integer "no_of_allowed_optional_holidays"
    t.string "holiday_types", default: [], array: true
    t.integer "time_period_optional_holidays", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "company_id", null: false
    t.datetime "discarded_at"
    t.index ["company_id"], name: "index_holidays_on_company_id"
    t.index ["discarded_at"], name: "index_holidays_on_discarded_at"
  end

  create_table "identities", force: :cascade do |t|
    t.string "provider"
    t.string "uid"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["provider"], name: "index_identities_on_provider"
    t.index ["user_id"], name: "index_identities_on_user_id"
  end

  create_table "invitations", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "sender_id", null: false
    t.string "recipient_email", null: false
    t.string "token", null: false
    t.datetime "accepted_at"
    t.datetime "expired_at"
    t.string "first_name"
    t.string "last_name"
    t.integer "role", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "client_id"
    t.boolean "virtual_verified", default: false
    t.index ["accepted_at"], name: "index_invitations_on_accepted_at"
    t.index ["client_id"], name: "index_invitations_on_client_id"
    t.index ["company_id"], name: "index_invitations_on_company_id"
    t.index ["expired_at"], name: "index_invitations_on_expired_at"
    t.index ["recipient_email"], name: "index_invitations_on_recipient_email"
    t.index ["role"], name: "index_invitations_on_role"
    t.index ["sender_id"], name: "index_invitations_on_sender_id"
    t.index ["token"], name: "index_invitations_on_token", unique: true
  end

  create_table "invoice_line_items", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.date "date"
    t.decimal "rate", precision: 20, scale: 2, default: "0.0"
    t.integer "quantity", default: 1
    t.bigint "invoice_id", null: false
    t.bigint "timesheet_entry_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["invoice_id"], name: "index_invoice_line_items_on_invoice_id"
    t.index ["timesheet_entry_id"], name: "index_invoice_line_items_on_timesheet_entry_id"
  end

  create_table "invoices", force: :cascade do |t|
    t.date "issue_date"
    t.date "due_date"
    t.string "invoice_number"
    t.text "reference"
    t.decimal "amount", precision: 20, scale: 2, default: "0.0"
    t.decimal "outstanding_amount", precision: 20, scale: 2, default: "0.0"
    t.decimal "tax", precision: 20, scale: 2, default: "0.0"
    t.decimal "amount_paid", precision: 20, scale: 2, default: "0.0"
    t.decimal "amount_due", precision: 20, scale: 2, default: "0.0"
    t.decimal "discount", precision: 20, scale: 2, default: "0.0"
    t.integer "status", default: 0, null: false
    t.bigint "client_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "external_view_key"
    t.jsonb "payment_infos", default: {}
    t.bigint "company_id"
    t.datetime "discarded_at"
    t.datetime "sent_at"
    t.datetime "payment_sent_at"
    t.datetime "client_payment_sent_at"
    t.boolean "stripe_enabled", default: true
    t.index ["client_id"], name: "index_invoices_on_client_id"
    t.index ["company_id"], name: "index_invoices_on_company_id"
    t.index ["discarded_at"], name: "index_invoices_on_discarded_at"
    t.index ["due_date"], name: "index_invoices_on_due_date"
    t.index ["external_view_key"], name: "index_invoices_on_external_view_key", unique: true
    t.index ["invoice_number", "company_id"], name: "index_invoices_on_invoice_number_and_company_id", unique: true
    t.index ["issue_date"], name: "index_invoices_on_issue_date"
    t.index ["status"], name: "index_invoices_on_status"
  end

  create_table "leave_types", force: :cascade do |t|
    t.string "name", null: false
    t.integer "icon", null: false
    t.integer "color", null: false
    t.integer "allocation_value", null: false
    t.integer "allocation_period", null: false
    t.integer "allocation_frequency", null: false
    t.integer "carry_forward_days", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "leave_id", null: false
    t.datetime "discarded_at"
    t.index ["color", "leave_id"], name: "index_leave_types_on_color_and_leave_id", unique: true
    t.index ["discarded_at"], name: "index_leave_types_on_discarded_at"
    t.index ["icon", "leave_id"], name: "index_leave_types_on_icon_and_leave_id", unique: true
    t.index ["leave_id"], name: "index_leave_types_on_leave_id"
  end

  create_table "leaves", force: :cascade do |t|
    t.integer "year"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "company_id", null: false
    t.datetime "discarded_at"
    t.index ["company_id"], name: "index_leaves_on_company_id"
    t.index ["discarded_at"], name: "index_leaves_on_discarded_at"
    t.index ["year", "company_id"], name: "index_leaves_on_year_and_company_id", unique: true
  end

  create_table "payments", force: :cascade do |t|
    t.bigint "invoice_id", null: false
    t.date "transaction_date", null: false
    t.text "note"
    t.decimal "amount", precision: 20, scale: 2, default: "0.0"
    t.integer "status", null: false
    t.integer "transaction_type", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name"
    t.index ["invoice_id"], name: "index_payments_on_invoice_id"
    t.index ["status"], name: "index_payments_on_status"
  end

  create_table "payments_providers", force: :cascade do |t|
    t.string "name", null: false
    t.boolean "connected", default: false
    t.boolean "enabled", default: false
    t.string "accepted_payment_methods", default: [], array: true
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_payments_providers_on_company_id"
    t.index ["connected"], name: "index_payments_providers_on_connected"
    t.index ["enabled"], name: "index_payments_providers_on_enabled"
    t.index ["name", "company_id"], name: "index_payments_providers_on_name_and_company_id", unique: true
  end

  create_table "previous_employments", force: :cascade do |t|
    t.string "company_name"
    t.string "role"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_previous_employments_on_user_id"
  end

  create_table "project_members", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "project_id", null: false
    t.decimal "hourly_rate", default: "0.0", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.index ["discarded_at"], name: "index_project_members_on_discarded_at"
    t.index ["project_id"], name: "index_project_members_on_project_id"
    t.index ["user_id"], name: "index_project_members_on_user_id"
  end

  create_table "projects", force: :cascade do |t|
    t.bigint "client_id", null: false
    t.string "name", null: false
    t.text "description"
    t.boolean "billable", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.index ["billable"], name: "index_projects_on_billable"
    t.index ["client_id"], name: "index_projects_on_client_id"
    t.index ["discarded_at"], name: "index_projects_on_discarded_at"
    t.index ["name", "client_id"], name: "index_projects_on_name_and_client_id", unique: true
  end

  create_table "roles", force: :cascade do |t|
    t.string "name"
    t.string "resource_type"
    t.bigint "resource_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name", "resource_type", "resource_id"], name: "index_roles_on_name_and_resource_type_and_resource_id"
    t.index ["resource_type", "resource_id"], name: "index_roles_on_resource"
  end

  create_table "ses_invalid_emails", force: :cascade do |t|
    t.string "email"
    t.boolean "bounce", default: false
    t.boolean "compliant", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
    t.integer "duration", null: false
    t.text "note", default: ""
    t.date "leave_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "leave_type_id"
    t.datetime "discarded_at"
    t.bigint "holiday_info_id"
    t.index ["discarded_at"], name: "index_timeoff_entries_on_discarded_at"
    t.index ["holiday_info_id"], name: "index_timeoff_entries_on_holiday_info_id"
    t.index ["leave_type_id"], name: "index_timeoff_entries_on_leave_type_id"
    t.index ["user_id"], name: "index_timeoff_entries_on_user_id"
  end

  create_table "timesheet_entries", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "project_id", null: false
    t.float "duration", null: false
    t.text "note", default: ""
    t.date "work_date", null: false
    t.integer "bill_status", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["bill_status"], name: "index_timesheet_entries_on_bill_status"
    t.index ["project_id"], name: "index_timesheet_entries_on_project_id"
    t.index ["user_id"], name: "index_timesheet_entries_on_user_id"
    t.index ["work_date"], name: "index_timesheet_entries_on_work_date"
  end

  create_table "users", force: :cascade do |t|
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "current_workspace_id"
    t.datetime "discarded_at"
    t.string "personal_email_id"
    t.date "date_of_birth"
    t.jsonb "social_accounts"
    t.string "phone"
    t.string "token", limit: 50
    t.boolean "calendar_enabled", default: true
    t.boolean "calendar_connected", default: true
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token"
    t.index ["current_workspace_id"], name: "index_users_on_current_workspace_id"
    t.index ["discarded_at"], name: "index_users_on_discarded_at"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "users_roles", id: false, force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "role_id"
    t.index ["role_id"], name: "index_users_roles_on_role_id"
    t.index ["user_id", "role_id"], name: "index_users_roles_on_user_id_and_role_id"
    t.index ["user_id"], name: "index_users_roles_on_user_id"
  end

  create_table "vendors", force: :cascade do |t|
    t.string "name"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_vendors_on_company_id"
  end

  create_table "wise_accounts", force: :cascade do |t|
    t.string "profile_id"
    t.string "recipient_id"
    t.string "source_currency"
    t.string "target_currency"
    t.bigint "user_id", null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_wise_accounts_on_company_id"
    t.index ["user_id", "company_id"], name: "index_wise_accounts_on_user_id_and_company_id", unique: true
    t.index ["user_id"], name: "index_wise_accounts_on_user_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "client_members", "clients"
  add_foreign_key "client_members", "companies"
  add_foreign_key "client_members", "users"
  add_foreign_key "clients", "companies"
  add_foreign_key "devices", "companies"
  add_foreign_key "devices", "users"
  add_foreign_key "employments", "companies"
  add_foreign_key "employments", "users"
  add_foreign_key "expense_categories", "companies"
  add_foreign_key "expenses", "companies"
  add_foreign_key "expenses", "expense_categories"
  add_foreign_key "expenses", "vendors"
  add_foreign_key "holiday_infos", "holidays"
  add_foreign_key "holidays", "companies"
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
  add_foreign_key "payments", "invoices"
  add_foreign_key "payments_providers", "companies"
  add_foreign_key "previous_employments", "users"
  add_foreign_key "project_members", "projects"
  add_foreign_key "project_members", "users"
  add_foreign_key "projects", "clients"
  add_foreign_key "stripe_connected_accounts", "companies"
  add_foreign_key "timeoff_entries", "leave_types"
  add_foreign_key "timeoff_entries", "users"
  add_foreign_key "timesheet_entries", "projects"
  add_foreign_key "timesheet_entries", "users"
  add_foreign_key "users", "companies", column: "current_workspace_id"
  add_foreign_key "vendors", "companies"
  add_foreign_key "wise_accounts", "companies"
  add_foreign_key "wise_accounts", "users"
end
