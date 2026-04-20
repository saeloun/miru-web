# frozen_string_literal: true

module Analytics
  class DemoSeeder < ApplicationService
    PASSWORD = "MiruAnalyticsDemo!2026#"
    CLIENT_PREFIX = "Analytics Demo"
    INVOICE_PREFIX = "AN-DEMO"
    EXPENSE_PREFIX = "Analytics demo expense"

    def initialize(company: nil)
      @company = company || default_company
      @counts = Hash.new(0)
    end

    def process
      raise "No company available for analytics demo seeding" if company.blank?

      setup_users
      setup_clients_and_projects
      seed_timesheet_entries
      seed_invoices_and_payments
      seed_expenses

      print_summary

      {
        company: company,
        counts: counts
      }
    end

    private

      attr_reader :company, :counts, :users, :clients, :projects

      def default_company
        Company.joins(:employments).merge(Employment.kept).distinct.first || Company.first
      end

      def setup_users
        existing_owner = company.users.with_role(:owner, company).first
        existing_admin = company.users.with_role(:admin, company).first
        existing_employees = company.users.with_role(:employee, company).limit(2).to_a

        owner = existing_owner || ensure_user!(email: "analytics.demo.owner@saeloun.test", first_name: "Analytics", last_name: "Owner", roles: [:owner])
        admin = existing_admin || ensure_user!(email: "analytics.demo.admin@saeloun.test", first_name: "Analytics", last_name: "Admin", roles: [:admin])

        employee_one = existing_employees[0] || ensure_user!(email: "analytics.demo.employee1@saeloun.test", first_name: "Analytics", last_name: "EmployeeOne", roles: [:employee])
        employee_two = existing_employees[1] || ensure_user!(email: "analytics.demo.employee2@saeloun.test", first_name: "Analytics", last_name: "EmployeeTwo", roles: [:employee])

        @users = {
          owner: owner,
          admin: admin,
          employees: [employee_one, employee_two]
        }
      end

      def ensure_user!(email:, first_name:, last_name:, roles:)
        user = User.find_or_initialize_by(email: email)
        user.assign_attributes(
          first_name: first_name,
          last_name: last_name,
          password: PASSWORD,
          password_confirmation: PASSWORD,
          confirmed_at: user.confirmed_at || Time.current,
          current_workspace_id: company.id
        )
        created = user.new_record?
        user.save!

        Employment.find_or_create_by!(company: company, user: user)
        roles.each { |role| user.add_role(role, company) unless user.has_role?(role, company) }
        counts[:users] += 1 if created
        user
      end

      def setup_clients_and_projects
        top_client = ensure_client!(name: "#{CLIENT_PREFIX} Atlas", email: "analytics.demo.atlas@client.test")
        medium_client = ensure_client!(name: "#{CLIENT_PREFIX} Beacon", email: "analytics.demo.beacon@client.test")
        small_client = ensure_client!(name: "#{CLIENT_PREFIX} Comet", email: "analytics.demo.comet@client.test")
        internal_client = ensure_client!(name: "#{CLIENT_PREFIX} Internal", email: "analytics.demo.internal@client.test")

        atlas_app = ensure_project!(client: top_client, name: "Atlas App", billable: true)
        atlas_api = ensure_project!(client: top_client, name: "Atlas API", billable: true)
        beacon_web = ensure_project!(client: medium_client, name: "Beacon Web", billable: true)
        comet_ops = ensure_project!(client: small_client, name: "Comet Ops", billable: true)
        internal_admin = ensure_project!(client: internal_client, name: "Internal Admin", billable: false)

        all_users.each do |user|
          ensure_project_member!(project: atlas_app, user: user, hourly_rate: base_rate + 10)
          ensure_project_member!(project: atlas_api, user: user, hourly_rate: base_rate + 20)
          ensure_project_member!(project: beacon_web, user: user, hourly_rate: base_rate)
          ensure_project_member!(project: comet_ops, user: user, hourly_rate: base_rate - 10)
          ensure_project_member!(project: internal_admin, user: user, hourly_rate: base_rate - 20)
        end

        @clients = {
          top: top_client,
          medium: medium_client,
          small: small_client,
          internal: internal_client
        }
        @projects = {
          atlas_app: atlas_app,
          atlas_api: atlas_api,
          beacon_web: beacon_web,
          comet_ops: comet_ops,
          internal_admin: internal_admin
        }
      end

      def ensure_client!(name:, email:)
        client = company.clients.find_or_initialize_by(email: email)
        created = client.new_record?
        client.assign_attributes(
          name: name,
          phone: "555#{rand(1_000_000..9_999_999)}"
        )
        client.currency = company.base_currency if client.respond_to?(:currency)
        client.save!
        counts[:clients] += 1 if created
        client
      end

      def ensure_project!(client:, name:, billable:)
        project = client.projects.find_or_initialize_by(name: name)
        created = project.new_record?
        project.assign_attributes(
          description: "Seeded analytics demo project",
          billable: billable
        )
        project.save!
        counts[:projects] += 1 if created
        project
      end

      def ensure_project_member!(project:, user:, hourly_rate:)
        member = ProjectMember.find_or_initialize_by(project: project, user: user)
        created = member.new_record?
        member.hourly_rate = hourly_rate
        member.save!
        counts[:project_members] += 1 if created
        member
      end

      def seed_timesheet_entries
        dates = (0..89).map { |offset| Date.current - offset.days }
                       .reject(&:saturday?)
                       .reject(&:sunday?)
                       .first(12)

        billable_projects = [projects[:atlas_app], projects[:atlas_api], projects[:beacon_web], projects[:comet_ops]]
        all_users.each_with_index do |user, user_index|
          dates.each_with_index do |work_date, date_index|
            project = (date_index + user_index) % 5 == 4 ? projects[:internal_admin] : billable_projects[(date_index + user_index) % billable_projects.length]
            note = "Analytics demo #{work_date}-u#{user.id}-p#{project.id}"

            entry = TimesheetEntry.find_or_initialize_by(
              user: user,
              project: project,
              work_date: work_date,
              note: note
            )

            next unless entry.new_record?

            entry.duration = project.billable ? [90, 120, 150, 180, 240].sample : [45, 60, 75, 90].sample
            entry.bill_status = project.billable ? :unbilled : :non_billable
            entry.review_status = default_review_status
            entry.source = "manual"
            entry.save!
            counts[:timesheet_entries] += 1
          end
        end
      end

      def seed_invoices_and_payments
        invoice_blueprint.each_with_index do |blueprint, index|
          invoice_number = "#{INVOICE_PREFIX}-#{format('%03d', index + 1)}"
          invoice = Invoice.find_or_initialize_by(company: company, client: blueprint[:client], invoice_number: invoice_number)
          created = invoice.new_record?

          if created
            invoice.assign_attributes(
              issue_date: blueprint[:issue_date],
              due_date: blueprint[:issue_date] + 14.days,
              status: :sent,
              currency: client_currency_for(blueprint[:client]),
              tax: 0,
              discount: 0,
              amount_paid: 0,
              amount_due: 0,
              outstanding_amount: 0,
              reference: format("AD%03d", index + 1)
            )
            invoice.save!
            counts[:invoices] += 1
          end

          if invoice.invoice_line_items.blank?
            blueprint[:entries].each_with_index do |entry, line_index|
              InvoiceLineItem.create!(
                invoice: invoice,
                timesheet_entry: entry,
                name: "#{entry.project.name} work ##{line_index + 1}",
                date: entry.work_date,
                quantity: entry.duration,
                rate: project_rate_for(entry)
              )
              counts[:invoice_line_items] += 1
            end
          end

          invoice.reload
          next if invoice.payments.exists?

          payment_date = [invoice.issue_date + blueprint[:payment_delay].days, Date.current].min
          if blueprint[:paid]
            amount = invoice.amount_due.to_f.positive? ? invoice.amount_due : invoice.amount
            payment = Payment.create!(
              invoice: invoice,
              amount: amount,
              transaction_date: payment_date,
              transaction_type: paid_transaction_type,
              status: paid_payment_status
            )
            invoice.settle!(payment)
            counts[:payments] += 1
          else
            partial_amount = [(invoice.amount_due.to_f * 0.4).round(2), 100.0].max
            partial_amount = [partial_amount, invoice.amount.to_f].min
            Payment.create!(
              invoice: invoice,
              amount: partial_amount,
              transaction_date: payment_date,
              transaction_type: paid_transaction_type,
              status: partial_payment_status
            )
            invoice.update!(amount_paid: partial_amount, amount_due: invoice.amount.to_f - partial_amount)
            counts[:payments] += 1
          end
        end
      end

      def invoice_blueprint
        billable_entries = TimesheetEntry.kept.where(id: company.timesheet_entries.select(:id)).where.not(bill_status: :non_billable).order(:work_date)
        atlas_entries = billable_entries.joins(:project).where(projects: { id: [projects[:atlas_app].id, projects[:atlas_api].id] }).to_a
        beacon_entries = billable_entries.where(project: projects[:beacon_web]).to_a
        comet_entries = billable_entries.where(project: projects[:comet_ops]).to_a

        [
          { client: clients[:top], issue_date: Date.current - 75.days, entries: atlas_entries.first(3), payment_delay: rand(2..6), paid: true },
          { client: clients[:top], issue_date: Date.current - 60.days, entries: atlas_entries[3, 3], payment_delay: rand(4..8), paid: true },
          { client: clients[:top], issue_date: Date.current - 40.days, entries: atlas_entries[6, 2], payment_delay: rand(6..10), paid: true },
          { client: clients[:medium], issue_date: Date.current - 68.days, entries: beacon_entries.first(3), payment_delay: rand(2..7), paid: true },
          { client: clients[:medium], issue_date: Date.current - 25.days, entries: beacon_entries[3, 2], payment_delay: rand(5..10), paid: false },
          { client: clients[:small], issue_date: Date.current - 35.days, entries: comet_entries.first(2), payment_delay: rand(2..5), paid: true }
        ].select { |spec| spec[:entries].present? }
      end

      def seed_expenses
        expense_rows.each_with_index do |row, index|
          description = "#{EXPENSE_PREFIX} ##{index + 1}"
          expense = Expense.find_or_initialize_by(
            company: company,
            user: row[:user],
            project: row[:project],
            date: row[:date],
            description: description
          )

          next unless expense.new_record?

          expense.assign_attributes(
            amount: row[:amount],
            category_name: row[:category],
            vendor_name: row[:vendor],
            expense_type: business_expense_type,
            status: approved_expense_status
          )
          expense.save!
          counts[:expenses] += 1
        end
      end

      def expense_rows
        [
          { date: Date.current - 72.days, amount: 120, category: "Travel", vendor: "Rail Co", project: projects[:atlas_app], user: users[:employees][0] },
          { date: Date.current - 68.days, amount: 180, category: "Software", vendor: "Figma", project: projects[:atlas_api], user: users[:owner] },
          { date: Date.current - 63.days, amount: 95, category: "Meals", vendor: "Cafe", project: projects[:beacon_web], user: users[:employees][1] },
          { date: Date.current - 56.days, amount: 140, category: "Travel", vendor: "Taxi", project: projects[:atlas_app], user: users[:employees][0] },
          { date: Date.current - 49.days, amount: 210, category: "Cloud", vendor: "AWS", project: projects[:atlas_api], user: users[:owner] },
          { date: Date.current - 41.days, amount: 160, category: "Software", vendor: "Linear", project: projects[:beacon_web], user: users[:employees][1] },
          { date: Date.current - 35.days, amount: 130, category: "Travel", vendor: "Rail Co", project: projects[:comet_ops], user: users[:employees][0] },
          { date: Date.current - 24.days, amount: 190, category: "Cloud", vendor: "AWS", project: projects[:atlas_api], user: users[:owner] },
          { date: Date.current - 18.days, amount: 220, category: "Travel", vendor: "Flight", project: projects[:atlas_app], user: users[:employees][1] },
          { date: Date.current - 10.days, amount: 4500, category: "Travel", vendor: "Conference", project: projects[:atlas_app], user: users[:owner] },
          { date: Date.current - 6.days, amount: 3800, category: "Travel", vendor: "Hotel", project: projects[:atlas_app], user: users[:employees][0] },
          { date: Date.current - 2.days, amount: 260, category: "Software", vendor: "Notion", project: projects[:beacon_web], user: users[:employees][1] }
        ]
      end

      def all_users
        [users[:owner], users[:admin], *users[:employees]]
      end

      def base_rate
        company.standard_price.to_f.positive? ? company.standard_price.to_f : 100.0
      end

      def default_review_status
        TimesheetEntry.review_statuses.keys.include?("not_required") ? :not_required : TimesheetEntry.review_statuses.keys.first.to_sym
      end

      def client_currency_for(client)
        client.respond_to?(:currency) && client.currency.present? ? client.currency : company.base_currency
      end

      def project_rate_for(entry)
        ProjectMember.find_by(project: entry.project, user: entry.user)&.hourly_rate&.to_f || base_rate
      end

      def paid_transaction_type
        Payment.transaction_types.keys.include?("bank_transfer") ? :bank_transfer : Payment.transaction_types.keys.first.to_sym
      end

      def paid_payment_status
        Payment.statuses.keys.include?("paid") ? :paid : Payment.statuses.keys.first.to_sym
      end

      def partial_payment_status
        Payment.statuses.keys.include?("partially_paid") ? :partially_paid : Payment.statuses.keys.first.to_sym
      end

      def business_expense_type
        Expense.expense_types.keys.include?("business") ? :business : Expense.expense_types.keys.first.to_sym
      end

      def approved_expense_status
        Expense.statuses.keys.include?("approved") ? :approved : Expense.statuses.keys.first.to_sym
      end

      def print_summary
        puts "== Analytics demo seeding complete =="
        puts "Company: #{company.name}"
        puts "Users created: #{counts[:users]}"
        puts "Clients created: #{counts[:clients]}"
        puts "Projects created: #{counts[:projects]}"
        puts "Project memberships created: #{counts[:project_members]}"
        puts "Timesheet entries created: #{counts[:timesheet_entries]}"
        puts "Invoices created: #{counts[:invoices]}"
        puts "Invoice line items created: #{counts[:invoice_line_items]}"
        puts "Payments created: #{counts[:payments]}"
        puts "Expenses created: #{counts[:expenses]}"
        puts "Dashboard should show revenue, top client, average hourly rate, and anomalies."
        puts "Revenue Forecast should show historical paid revenue and projections."
        puts "Team Analytics should show non-zero total hours, billable hours, and utilization."
        puts "Client Insights should show revenue, payment cycles, frequency, heatmap, and top clients."
        puts "Expense Trends should show real values and at least one anomaly."
        puts "Invoice client analytics summary should show non-zero values for demo clients."
      end
  end
end
