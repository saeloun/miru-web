# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice row lookup", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD") }
  let(:user) { create(:user, current_workspace: company) }
  let(:client) { create(:client, company:) }

  before do
    create(:employment, company:, user:)
    user.add_role(:admin, company)
    sign_in(user)
  end

  %w[name row].each do |lookup|
    it "reacquires a row replaced after the #{lookup} query" do
      with_forgery_protection do
        visit_new_invoice_for(client)
        add_manual_line_item(name: "Replaced row", rate: "100", quantity: "01:00")
        find("[data-testid='invoice-manual-entry-quantity']").send_keys(:enter)
        original_key = find("[data-testid='invoice-line-item-row']")["data-line-item-row-key"]
        replaced = false
        replace_row = lambda do |original, *arguments, **options, &block|
          node = original.call(*arguments, **options, &block)
          target = lookup == "name" ? arguments == [:fillable_field] && options[:with] == "Replaced row" :
            arguments == [:xpath, "./ancestor::tr[1]"]
          if !replaced && target
            replaced = true
            page.execute_script(<<~JS, node)
              const row = arguments[0].closest('tr');
              row.replaceWith(row.cloneNode(true));
            JS
          end
          node
        end
        if lookup == "name"
          allow(self).to receive(:find).and_wrap_original(&replace_row)
        else
          allow_any_instance_of(Capybara::Node::Element).to receive(:find).and_wrap_original(&replace_row)
        end

        expect_invoice_line_item("Replaced row")
        expect(replaced).to be(true)
        expect(find("[data-testid='invoice-line-item-row']")["data-line-item-row-key"]).to eq(original_key)
      end
    end
  end
end
