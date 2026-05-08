# frozen_string_literal: true

module InvoiceEditorSystemHelpers
  def formatted_invoice_currency(amount, currency)
    case currency
    when "EUR"
      "€#{format('%.2f', amount)}"
    when "INR"
      "₹#{format('%.2f', amount)}"
    else
      "$#{format('%.2f', amount)}"
    end
  end

  def parsed_last_invoice_mutation_request_body
    request_body = last_invoice_mutation_response&.fetch("requestBody", nil)
    return {} unless request_body.present?

    JSON.parse(request_body)
  end

  def install_invoice_request_capture
    page.execute_script(<<~JS)
      if (window.__miruInvoiceRequestCaptureInstalled && window.__miruInvoiceRequestCaptureRestore) {
        window.__miruInvoiceRequestCaptureRestore();
      }

      if (!window.__miruInvoiceRequestCaptureInstalled) {
        window.__lastInvoiceMutationResponse = null;

        const captureInvoiceResponse = async (response, requestBody = null) => {
          const url = response.url;
          const method = response.method;

          if (!url.includes("/api/v1/invoices") || !["POST", "PATCH"].includes(method)) {
            return response;
          }

          let body = null;

          try {
            body = await response.clone().text();
          } catch (_error) {
            body = null;
          }

          window.__lastInvoiceMutationResponse = {
            url,
            method,
            status: response.status,
            ok: response.ok,
            requestBody,
            body,
          };

          return response;
        };

        const originalFetch = window.fetch.bind(window);
        window.fetch = (...args) =>
          originalFetch(...args).then(response =>
            captureInvoiceResponse(response, args[1]?.body || null)
          );

        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
          this.__miruCaptureMethod = method;
          this.__miruCaptureUrl = url;
          return originalOpen.call(this, method, url, ...rest);
        };

        XMLHttpRequest.prototype.send = function (...args) {
          const [requestBody] = args;

          this.addEventListener("loadend", () => {
            if (
              this.__miruCaptureUrl?.includes("/api/v1/invoices") &&
              ["POST", "PATCH"].includes(this.__miruCaptureMethod)
            ) {
              window.__lastInvoiceMutationResponse = {
                url: this.__miruCaptureUrl,
                method: this.__miruCaptureMethod,
                status: this.status,
                ok: this.status >= 200 && this.status < 300,
                requestBody,
                body: this.responseText,
              };
            }
          });

          return originalSend.apply(this, args);
        };

        window.__miruInvoiceRequestCaptureRestore = () => {
          window.fetch = originalFetch;
          XMLHttpRequest.prototype.open = originalOpen;
          XMLHttpRequest.prototype.send = originalSend;
          delete window.__miruInvoiceRequestCaptureRestore;
          window.__miruInvoiceRequestCaptureInstalled = false;
        };

        window.__miruInvoiceRequestCaptureInstalled = true;
      }

      window.__lastInvoiceMutationResponse = null;
    JS
  end

  def last_invoice_mutation_response
    page.document.synchronize(Capybara.default_max_wait_time) do
      response = page.evaluate_script("window.__lastInvoiceMutationResponse")
      raise Capybara::ExpectationNotMet, "waiting for invoice mutation response" if response.blank?

      response
    end
  rescue Capybara::ExpectationNotMet
    nil
  end

  def visit_new_invoice_for(client)
    visit "/invoices/new?clientId=#{client.id}"
    expect_invoice_editor_loaded
    expect(page).to have_button(client.name, wait: 10)
  end

  def visit_invoice_editor(invoice)
    visit "/invoices/#{invoice.id}/edit"
    expect_invoice_editor_loaded
    expect(page).to have_current_path("/invoices/#{invoice.id}/edit", ignore_query: true, wait: 10)
  end

  def expect_invoice_editor_loaded
    expect(page).to have_css("#react-root", wait: 10)
    expect(page).to have_field("invoiceNumber", wait: 10)
  end

  def select_invoice_client(name)
    find("[data-testid='invoice-client-select']", wait: 10).click
    find("[role='option']", text: name, wait: 10).click
  end

  def add_manual_line_item(name:, rate:, quantity:, description: nil)
    click_button "LINE ITEMS"
    fill_in_pending_manual_line_item(
      name:,
      rate:,
      quantity:,
      description:
    )
  end

  def fill_in_pending_manual_line_item(name:, rate:, quantity:, description: nil)
    find("[data-testid='invoice-manual-entry-name']", wait: 10).set(name)
    find("[data-testid='invoice-manual-entry-rate']", wait: 10).set(rate)
    find("[data-testid='invoice-manual-entry-quantity']", wait: 10).set(quantity)
    if description
      find("[data-testid='invoice-manual-entry-description']", wait: 10).set(description)
    end
  end

  def commit_pending_manual_line_item(name:)
    find("[data-testid='invoice-manual-entry-quantity']", wait: 10).send_keys(:enter)
    expect(page).to have_text(name, wait: 10)
  end

  def add_timesheet_line_item(description:)
    click_button "LINE ITEMS"
    find("[data-testid='invoice-manual-entry-name']", wait: 10).click
    find("#entriesList", text: description, wait: 10).click
    expect(page).to have_text(description, wait: 10)
  end

  def update_invoice_line_item(original_name:, name: nil, rate: nil, quantity: nil, description: nil)
    row = find_invoice_line_item_row(original_name)
    inputs = row.all("input")

    inputs[0].set(name) if name
    inputs[2].set(rate) if rate
    inputs[3].set(quantity) if quantity

    if description
      row.find(:xpath, "following-sibling::tr[1]//textarea", wait: 10).set(description)
    end
  end

  def remove_invoice_line_item(name)
    find_invoice_line_item_row(name).find("#deleteLineItemButton", wait: 10).click
  end

  def find_invoice_line_item_row(name)
    find(:fillable_field, with: name, wait: 10).find(:xpath, "./ancestor::tr[1]")
  end

  def save_invoice
    install_invoice_request_capture
    click_button "Save"
  end

  def show_invoice_preview
    return false if has_css?("[data-testid='invoice-preview']", wait: 1)

    find("button", text: /preview/i, wait: 10).click
    expect(page).to have_css("[data-testid='invoice-preview']", wait: 10)

    true
  end

  def show_invoice_editor
    return if has_button?("Save", wait: 1)

    find("button", text: /edit/i, wait: 10).click
    expect(page).to have_button("Save", wait: 10)
  end

  def expect_invoice_preview_totals(currency:, subtotal:, total_due:, discount: nil, tax: nil)
    toggled_preview = show_invoice_preview

    within "[data-testid='invoice-preview']" do
      expect(page).to have_text("Subtotal", wait: 10)
      expect(page).to have_text(formatted_invoice_currency(subtotal, currency), wait: 10)
      expect(page).to have_text("Total Due", wait: 10)
      expect(page).to have_text(formatted_invoice_currency(total_due, currency), wait: 10)
      expect(page).to have_text("-#{formatted_invoice_currency(discount, currency)}", wait: 10) if discount
      expect(page).to have_text(formatted_invoice_currency(tax, currency), wait: 10) if tax
    end
  ensure
    show_invoice_editor if toggled_preview
  end
end

RSpec.configure do |config|
  config.include InvoiceEditorSystemHelpers, type: :system
end
