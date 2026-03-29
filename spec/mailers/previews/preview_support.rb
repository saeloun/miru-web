# frozen_string_literal: true

module PreviewSupport
  private

    def sample_company
      latest_company = Company.order(updated_at: :desc).first
      latest_company = nil if latest_company&.timezone.present? && ActiveSupport::TimeZone[latest_company.timezone].blank?

      @sample_company ||= latest_company || Company.create!(
        name: "Miru Studio",
        business_phone: "+14155550101",
        base_currency: "USD",
        standard_price: 125,
        fiscal_year_end: "December",
        date_format: "MM-DD-YYYY",
        country: "US",
        timezone: "Eastern Time (US & Canada)",
        working_days: "5",
        working_hours: "40"
      )
    end

    def sample_user
      @sample_user ||= User.order(updated_at: :desc).first || User.create!(
        first_name: "Vipul",
        last_name: "Amler",
        email: "vipul-preview@miru.so",
        password: "Preview@1234!",
        confirmed_at: Time.current,
        date_of_birth: Date.new(1994, 1, 1),
        phone: "+14155550111",
        personal_email_id: "vipul.personal@miru.so",
        current_workspace: sample_company
      )
    end

    def sample_client
      @sample_client ||= sample_company.clients.kept.order(updated_at: :desc).first || sample_company.clients.create!(
        name: "Northwind Studio",
        email: "billing@northwind.example",
        phone: "+14155550121",
        currency: sample_company.base_currency
      )
    end

    def sample_invoice
      @sample_invoice ||= Invoice.order(updated_at: :desc).first || build_sample_invoice
    end

    def sample_expense
      @sample_expense ||= Expense.kept_ordered.first || Expense.create!(
        company: sample_company,
        user: sample_user,
        amount: 248.75,
        expense_type: :business,
        date: Date.current - 2.days,
        category_name: "Travel",
        description: "Airport taxi and client lunch"
      )
    end

    def sample_invitation_payload
      {
        recipient: "new.joiner@miru.so",
        token: SecureRandom.hex(10),
        user_already_exists: false,
        name: "Ava Jones",
        company_details: {
          name: sample_company.name,
          logo: sample_company.company_logo,
          employee_count: sample_company.employees_without_client_role.count
        },
        sender_details: {
          email: sample_user.email,
          avatar: sample_user.avatar_url,
          name: sample_user.full_name
        }
      }
    end

    def sample_recipients
      [sample_user.email]
    end

    def sample_pdf_data
      "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"
    end

    def build_sample_invoice
      invoice = sample_company.invoices.create!(
        client: sample_client,
        issue_date: Date.current - 7.days,
        due_date: Date.current + 14.days,
        invoice_number: "PR-#{SecureRandom.hex(2).upcase}",
        reference: "PREVIEW",
        amount: 3200,
        amount_due: 3200,
        outstanding_amount: 3200,
        status: :draft,
        base_currency_amount: 3200,
        currency: sample_company.base_currency
      )

      invoice.invoice_line_items.create!(
        name: "Design retainer",
        description: "Weekly product design and engineering support",
        date: invoice.issue_date,
        quantity: 240,
        rate: 200
      )

      invoice
    end
end
