# Added this task to quickly send all emails to preview if something is not working

namespace :email do
  desc "Preview all emails to check styling"
  task preview_all: :environment do
    puts "\n" + "="*80
    puts "EMAIL PREVIEW - Generating all email types"
    puts "="*80

    emails = []

    # 1. User Invitation Email
    begin
      mail = UserInvitationMailer.with(
        recipient: "newuser@example.com",
        name: "New User",
        token: "test-token-123",
        sender_details: { name: "Test Sender", email: "sender@example.com", avatar: nil },
        company_details: { name: "Test Company", employee_count: 10, logo: nil },
        user_already_exists: false
      ).send_user_invitation
      emails << { name: "User Invitation", mail: mail, file: "user_invitation.html" }
      puts "✓ User Invitation email generated"
    rescue => e
      puts "✗ User Invitation email failed: #{e.message}"
    end

    # 2. Weekly Reminder Email
    begin
      mail = SendWeeklyReminderToUserMailer.with(
        recipients: "test@example.com",
        company_name: "Test Company",
        name: "Test User",
        start_date: 1.week.ago.to_date,
        end_date: Date.today
      ).notify_user_about_missed_entries
      emails << { name: "Weekly Reminder", mail: mail, file: "weekly_reminder.html" }
      puts "✓ Weekly Reminder email generated"
    rescue => e
      puts "✗ Weekly Reminder email failed: #{e.message}"
    end

    # Setup test data for invoice-related emails (wrapped in transaction to avoid persisting)
    ActiveRecord::Base.transaction(requires_new: true) do
      company = Company.first
      if company
        client = company.clients.first || company.clients.create!(
          name: "Test Client Company",
          email: "client@example.com",
          phone: "+1234567890",
          address: "123 Client St, City, State 12345"
        )

        # 3. Invoice Email - requires status: sending and recently_sent_mail
        begin
        invoice_for_sending = Invoice.create!(
          company: company,
          client: client,
          invoice_number: "INV-SEND-#{Time.now.to_i}",
          amount: 2500.00,
          outstanding_amount: 2500.00,
          currency: company.base_currency || "USD",
          issue_date: Date.today,
          due_date: 30.days.from_now,
          status: :sending,
          external_view_key: SecureRandom.hex(10),
          sent_at: nil  # Makes recently_sent_mail? return true
        )

        mail = InvoiceMailer.with(
          invoice_id: invoice_for_sending.id,
          recipients: "client@example.com",
          subject: "Invoice #{invoice_for_sending.invoice_number}",
          message: "Please find attached your invoice for services rendered."
        ).invoice

        if mail
          emails << { name: "Invoice Email", mail: mail, file: "invoice.html" }
          puts "✓ Invoice email generated"
        else
          puts "⊘ Invoice email skipped (validation failed)"
        end
      rescue => e
        puts "✗ Invoice email failed: #{e.message}"
      end

      # 4. Payment Reminder Email - requires existing invoice
      begin
        invoice_for_reminder = Invoice.where(company: company, client: client).where.not(status: :sending).first
        invoice_for_reminder ||= Invoice.create!(
          company: company,
          client: client,
          invoice_number: "INV-REM-#{Time.now.to_i}",
          amount: 1500.00,
          outstanding_amount: 1500.00,
          currency: company.base_currency || "USD",
          issue_date: 15.days.ago,
          due_date: 15.days.from_now,
          status: :sent,
          external_view_key: SecureRandom.hex(10)
        )

        mail = SendReminderMailer.with(
          invoice: invoice_for_reminder,
          recipients: "client@example.com",
          subject: "Payment Reminder - Invoice #{invoice_for_reminder.invoice_number}",
          message: "This is a friendly reminder about your pending invoice."
        ).send_reminder

        emails << { name: "Payment Reminder", mail: mail, file: "payment_reminder.html" }
        puts "✓ Payment Reminder email generated"
      rescue => e
        puts "✗ Payment Reminder email failed: #{e.message}"
      end

      # 5. Payment Confirmation Email - requires payment_sent_at to be nil
      begin
        invoice_for_payment = Invoice.create!(
          company: company,
          client: client,
          invoice_number: "INV-PAY-#{Time.now.to_i}",
          amount: 3000.00,
          outstanding_amount: 0.00,
          currency: company.base_currency || "USD",
          issue_date: 10.days.ago,
          due_date: Date.today,
          status: :paid,
          external_view_key: SecureRandom.hex(10),
          payment_sent_at: nil  # Required for can_send_mail? to return true
        )

        mail = PaymentMailer.with(
          invoice_id: invoice_for_payment.id,
          subject: "Payment Received - Invoice #{invoice_for_payment.invoice_number}"
        ).payment

        if mail
          emails << { name: "Payment Confirmation", mail: mail, file: "payment_confirmation.html" }
          puts "✓ Payment Confirmation email generated"
        else
          puts "⊘ Payment Confirmation email skipped (validation failed)"
        end
      rescue => e
        puts "✗ Payment Confirmation email failed: #{e.message}"
      end

      # 6. Client Payment Receipt Email - requires client_payment_sent_at to be nil
      begin
        invoice_for_receipt = Invoice.create!(
          company: company,
          client: client,
          invoice_number: "INV-REC-#{Time.now.to_i}",
          amount: 1800.00,
          outstanding_amount: 0.00,
          currency: company.base_currency || "USD",
          issue_date: 5.days.ago,
          due_date: Date.today,
          status: :paid,
          external_view_key: SecureRandom.hex(10),
          client_payment_sent_at: nil  # Required for can_send_mail? to return true
        )

        mail = ClientPaymentMailer.with(
          invoice_id: invoice_for_receipt.id,
          subject: "Payment Receipt - Invoice #{invoice_for_receipt.invoice_number}"
        ).payment

        if mail
          emails << { name: "Client Payment Receipt", mail: mail, file: "client_payment_receipt.html" }
          puts "✓ Client Payment Receipt email generated"
        else
          puts "⊘ Client Payment Receipt email skipped (validation failed)"
        end
      rescue => e
        puts "✗ Client Payment Receipt email failed: #{e.message}"
      end

      # 7. Bulk Payment Reminder Email - requires multiple invoices
      begin
        # Create multiple overdue invoices
        bulk_invoices = []
        3.times do |i|
          bulk_invoices << Invoice.create!(
            company: company,
            client: client,
            invoice_number: "INV-BULK-#{Time.now.to_i}-#{i}",
            amount: (1000 + i * 500).to_f,
            outstanding_amount: (1000 + i * 500).to_f,
            currency: company.base_currency || "USD",
            issue_date: (30 + i * 10).days.ago,
            due_date: (5 + i * 5).days.ago,
            status: :overdue,
            external_view_key: SecureRandom.hex(10)
          )
        end

        mail = SendPaymentReminderMailer.with(
          selected_invoices: bulk_invoices.map(&:id),
          recipients: "client@example.com",
          subject: "Payment Reminder - Outstanding Invoices",
          message: "This is a reminder about your outstanding invoices. Please review and process payment at your earliest convenience."
        ).send_payment_reminder

        emails << { name: "Bulk Payment Reminder", mail: mail, file: "bulk_payment_reminder.html" }
        puts "✓ Bulk Payment Reminder email generated"
      rescue => e
        puts "✗ Bulk Payment Reminder email failed: #{e.message}"
      end
      else
        puts "⊘ Invoice-related emails skipped (no company data found)"
        puts "  Please ensure you have at least one company in your database"
      end

      # Rollback transaction to avoid persisting test data
      raise ActiveRecord::Rollback
    end

    puts "\n" + "-"*80
    puts "SENDING EMAILS"
    puts "-"*80

    emails.each_with_index do |email_data, index|
      html_body = email_data[:mail].html_part ? email_data[:mail].html_part.body.to_s : email_data[:mail].body.to_s

      # Save to file
      File.write("tmp/#{email_data[:file]}", html_body)

      # Analyze styling
      has_styles = html_body.include?('<style>') || html_body.include?('style=')
      has_colors = html_body.match?(/#[0-9A-Fa-f]{6}|rgb\(/)
      has_images = html_body.include?('<img')

      puts "\n#{index + 1}. #{email_data[:name]}:"
      puts "   - Has styling: #{has_styles ? '✓' : '✗ NEEDS STYLING'}"
      puts "   - Has colors: #{has_colors ? '✓' : '✗ Plain text'}"
      puts "   - Has images: #{has_images ? '✓' : '✗ Text only'}"

      if !has_styles || !has_colors
        puts "   ⚠️  This email could benefit from rich styling"
      end

      # Deliver the email
      begin
        email_data[:mail].deliver_now
        puts "   ✓ Email sent and opened in letter_opener"
      rescue => e
        puts "   ✗ Failed to send: #{e.message}"
      end

      # Small delay between emails
      sleep(0.5)
    end

    puts "\n" + "="*80
    puts "All emails sent! Check your browser to view them with letter_opener"
    puts "Total emails generated: #{emails.count}/7"
    puts "Files also saved to tmp/ directory for reference"
    puts "="*80 + "\n"
  end

  desc "Test invitation email with premailer"
  task test_invitation: :environment do
    mail = UserInvitationMailer.with(
      recipient: "test@example.com",
      name: "Test User",
      token: "test-token-123",
      sender_details: { name: "Test Sender", email: "sender@example.com", avatar: nil },
      company_details: { name: "Test Company", employee_count: 10, logo: nil },
      user_already_exists: false
    ).send_user_invitation

    html_body = mail.html_part ? mail.html_part.body.to_s : mail.body.to_s
    File.write('tmp/test_email.html', html_body)

    puts "\n✓ Email HTML saved to tmp/test_email.html"
    puts "✓ Delivering email..."
    mail.deliver_now
    puts "✓ Email delivered (check your browser if letter_opener is configured)"
  end
end
