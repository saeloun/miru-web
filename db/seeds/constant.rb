# frozen_string_literal: true

SAELOUN_INDIA, SAELOUN_US = ["Saeloun India Pvt. Ltd", "Saeloun USA INC."].map { |company| Company.find_by(name: company) }
VIPUL, SUPRIYA, AKHIL, KESHAV, ROHIT = ["vipul@example.com", "supriya@example.com", "akhil@example.com", "keshav@example.com", "rohit@example.com"].map { |user| User.find_by(email: user) }

TIMESHEET_ENTRY_START_DATE = (Date.today.beginning_of_month - 7)
TIMESHEET_ENTRY_END_DATE = (Date.today.end_of_month + 7)
