# frozen_string_literal: true

module PreviewSupport
  private

    def preview_timestamp
      @preview_timestamp ||= Time.zone.local(2026, 3, 1, 12, 0, 0)
    end

    def sample_company
      @sample_company ||= begin
        company = Company.find_by(name: "Miru Preview Studio")
        unless company
          company = Company.create!(
            name: "Miru Preview Studio",
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
          company.addresses.create!(
            address_type: :current,
            address_line_1: "548 Market Street",
            address_line_2: "Suite 42112",
            city: "San Francisco",
            state: "California",
            country: "US",
            pin: "94104"
          )
        end
        company
      end
    end

    def sample_user
      @sample_user ||= begin
        user = User.find_by(email: "vipul-preview@miru.so")
        user ||= User.create!(
          first_name: "Vipul",
          last_name: "Amler",
          email: "vipul-preview@miru.so",
          password: "Preview@1234!",
          confirmed_at: preview_timestamp,
          date_of_birth: Date.new(1994, 1, 1),
          phone: "+14155550111",
          personal_email_id: "vipul.personal@miru.so",
          current_workspace: sample_company
        )
        user.add_role(:owner, sample_company) unless user.has_role?(:owner, sample_company)
        user
      end
    end

    def sample_client
      @sample_client ||= sample_company.clients.kept.find_by(email: "billing@northwind.example") || sample_company.clients.create!(
          name: "Northwind Studio",
          email: "billing@northwind.example",
          phone: "+14155550121",
          currency: sample_company.base_currency
        )
    end

    def sample_invoice
      @sample_invoice ||= build_sample_invoice
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
      invoice = sample_company.invoices.find_by(invoice_number: "PREVIEW-001")
      return invoice if invoice

      invoice = sample_company.invoices.create!(
        client: sample_client,
        invoice_number: "PREVIEW-001",
        issue_date: Date.new(2026, 3, 24),
        due_date: Date.new(2026, 4, 7),
        reference: "PREVIEW",
        amount: 3200,
        amount_due: 3200,
        outstanding_amount: 3200,
        status: :sending,
        sent_at: preview_timestamp,
        payment_sent_at: nil,
        client_payment_sent_at: nil,
        base_currency_amount: 3200,
        currency: sample_company.base_currency
      )

      invoice.invoice_line_items.create!(
        name: "Design retainer",
        description: "Weekly product design and engineering support",
        date: invoice.issue_date,
        quantity: 16,
        rate: 200
      )

      invoice
    end
end
