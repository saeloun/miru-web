# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Razorpay OAuth captured payment reviews", type: :request do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
  end

  let(:review) { PaymentProviders::RazorpayPaymentReview }
  let(:company) { create(:india_company, base_currency: "INR") }
  let(:owner) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: owner, resigned_at: nil) }
  let(:client) { create(:client, company:, currency: "INR", name: "Acme", email: "client@example.com") }
  let(:invoice) do
    create(:invoice, company:, client:, currency: "INR", amount: 1000, amount_due: 1000, amount_paid: 0, status: "sent",
      payment_infos: { "razorpay_payment_link_id" => "plink_oauth", "razorpay_payment_link_url" => "https://rzp.io/rzp/oauth",
                       "razorpay_payment_link_status" => "created", "razorpay_payment_link_account_id" => "acc_synthetic" })
  end
  let(:provider) { create(:payments_provider, company:, name: "razorpay", settings: { platform_fee_percent: "0" }) }
  let(:links_url) { "https://api.razorpay.com/v1/payment_links" }
  let(:json) { { "Content-Type" => "application/json" } }
  let(:link) do
    { id: "plink_oauth", short_url: "https://rzp.io/rzp/oauth", status: "created", amount: 100_000, amount_paid: 0, currency: "INR",
      reference_id: "miru-inv-#{invoice.id}-abcd1234", notes: { miru_invoice_id: invoice.id.to_s, company_id: company.id.to_s } }
  end
  let(:paid_link) { link.merge(status: "paid", amount_paid: 100_000) }

  around do |example|
    VCR.turned_off do
      WebMock.disable_net_connect!
      example.run
    end
  end

  prepend_before do
    stub_request(:get, %r{\Ahttps://api\.pwnedpasswords\.com/range/}).to_return(status: 200, body: "")
  end

  before do
    owner.add_role(:owner, company)
    stub_razorpay_oauth_env
    connect_razorpay_oauth(provider, owner)
    PaymentProviders::RazorpayOauthConnection.new(provider:, actor: owner).update_collections!(enabled: true)
  end

  def capture_event(payment_id = "pay_one", link_id: "plink_oauth", amount: 100_000)
    { entity: "event", account_id: "acc_synthetic", event: "payment_link.paid", contains: ["payment_link", "payment"], created_at: Time.current.to_i,
      payload: { payment_link: { entity: paid_link.merge(id: link_id) }, payment: { entity: { id: payment_id, status: "captured", amount:, currency: "INR" } } } }
  end

  def flag(payment_id, record = invoice)
    review.flag!(record, payment_id:, payment_link_id: "plink_oauth", amount: 100_000, reason: "webhook_mismatch", currency: "INR")
  end

  def stub_fetch(body)
    stub_request(:get, "#{links_url}/plink_oauth").to_return(status: 200, body: body.to_json, headers: json)
  end

  def resolve(review_id, record = invoice)
    sign_in owner
    post "/payments/razorpay/connection/payment_review", params: { invoice_id: record.id, review_id: }, as: :json
  end

  def pending_ids(record = invoice)
    review.reviews_for(record.reload).keys
  end

  def settled_elsewhere
    invoice.update!(status: :paid, amount_due: 0, amount_paid: 1000)
  end

  describe "recording captures" do
    it "preserves payment evidence against hard deletion" do
      flag("pay_one")
      expect { invoice.destroy }.not_to change { Invoice.exists?(invoice.id) }
      expect(pending_ids).to eq(["pay_one"])
    end

    it "keeps a signed capture for review when invoice validation prevents settlement" do
      invoice.update_columns(due_date: invoice.issue_date - 1.day)
      post_razorpay_oauth_event(capture_event("pay_invalid"))
      expect(response).to have_http_status(:ok)
      expect(invoice.reload).not_to be_paid
      expect(invoice.payments).to be_empty
      expect(review.pending_for(company)).to contain_exactly(a_hash_including(payment_id: "pay_invalid", reason: "invoice_invalid"))
    end

    it "lists a distinct capture on a paid invoice once, with its references, without changing the invoice" do
      settled_elsewhere
      2.times { post_razorpay_oauth_event(capture_event("pay_late")) }
      expect(response).to have_http_status(:ok)
      expect(invoice.reload).to be_paid
      expect(invoice.payments).to be_empty
      expect(review.pending_for(company)).to contain_exactly(a_hash_including(
        review_id: "pay_late", payment_id: "pay_late", payment_link_id: "plink_oauth", reason: "invoice_paid", invoice_state: "paid",
        currency: "INR", amount: 100_000))
      expect(Audited::Audit.where(auditable: invoice, action: "razorpay_oauth_payment_needs_review").count).to eq(1)
    end

    it "lists a capture on a deleted invoice, through its tracked link and an untracked one" do
      invoice.discard!
      post_razorpay_oauth_event(capture_event("pay_tracked"))
      post_razorpay_oauth_event(capture_event("pay_untracked", link_id: "plink_old"))
      expect(invoice.reload).not_to be_paid
      expect(invoice.payments).to be_empty
      expect(review.pending_for(company)).to contain_exactly(
        a_hash_including(payment_id: "pay_tracked", reason: "invoice_deleted", invoice_state: "deleted"),
        a_hash_including(payment_id: "pay_untracked", reason: "invoice_deleted", invoice_state: "deleted"))
    end

    it "keeps a capture on a waived invoice in review and closes its old link" do
      invoice
      expect { invoice.update!(status: :waived) }.to have_enqueued_job(CancelRazorpayPaymentLinkJob)
      post_razorpay_oauth_event(capture_event("pay_waived"))
      expect(invoice.reload).to be_waived
      expect(invoice.payments).to be_empty
      expect(review.pending_for(company)).to contain_exactly(a_hash_including(payment_id: "pay_waived", reason: "invoice_waived", invoice_state: "waived"))
    end

    it "keeps a second capture when one is already in review" do
      invoice.update!(amount_due: 600)
      post_razorpay_oauth_event(capture_event("pay_one"))
      post_razorpay_oauth_event(capture_event("pay_two"))
      expect(pending_ids).to contain_exactly("pay_one", "pay_two")
    end

    it "does not invent an amount or currency when the captured payment omitted them" do
      review.flag!(invoice, payment_id: "pay_unknown", payment_link_id: "plink_oauth", amount: nil, reason: "webhook_mismatch")
      expect(review.pending_for(company)).to contain_exactly(a_hash_including(amount: nil, currency: nil))
    end

    it "formats the captured currency's subunits independently of the invoice currency" do
      review.flag!(invoice, payment_id: "pay_jpy", payment_link_id: "plink_oauth", amount: 1000, currency: "JPY", reason: "webhook_mismatch")
      expect(review.pending_for(company)).to contain_exactly(a_hash_including(currency: "JPY", display_amount: "1000"))
    end

    it "does not review a payment the return callback already settled" do
      stub_fetch(paid_link.merge(payments: [{ payment_id: "pay_one", status: "captured", amount: 100_000 }]))
      get razorpay_success_invoice_payments_path(invoice_id: invoice.external_view_key),
        params: { razorpay_payment_link_id: "plink_oauth", razorpay_payment_link_status: "paid", razorpay_payment_id: "pay_one" }
      expect(invoice.reload).to be_paid
      post_razorpay_oauth_event(capture_event("pay_one"))
      expect(pending_ids).to be_empty
      expect(invoice.payments.count).to eq(1)
    end

    it "removes a link placeholder when the corresponding capture settles" do
      review.flag!(invoice, payment_id: nil, payment_link_id: "plink_oauth", amount: nil, reason: "paid_link_mismatch", currency: "INR")
      post_razorpay_oauth_event(capture_event("pay_one"))
      expect(invoice.reload).to be_paid
      expect(invoice.payments.count).to eq(1)
      expect(pending_ids).to be_empty
    end

    %i[webhook callback].each do |source|
      it "does not settle a resolved payment replayed through #{source} on the same link" do
        flag("pay_one")
        flag("pay_two")
        resolve("pay_one")
        if source == :webhook
          post_razorpay_oauth_event(capture_event("pay_one"))
        else
          stub_fetch(paid_link.merge(payments: [{ payment_id: "pay_one", status: "captured", amount: 100_000 }]))
          get razorpay_success_invoice_payments_path(invoice_id: invoice.external_view_key),
            params: { razorpay_payment_link_id: "plink_oauth", razorpay_payment_link_status: "paid", razorpay_payment_id: "pay_one" }
        end
        expect(invoice.reload).not_to be_paid
        expect(invoice.payments).to be_empty
        expect(pending_ids).to eq(["pay_two"])
      end
    end

    it "records another capture found on the link when the callback returns to a paid invoice" do
      settled_elsewhere
      stub_fetch(paid_link.merge(payments: [{ payment_id: "pay_late", status: "captured", amount: 100_000 }]))
      get razorpay_success_invoice_payments_path(invoice_id: invoice.external_view_key),
        params: { razorpay_payment_link_id: "plink_oauth", razorpay_payment_link_status: "paid", razorpay_payment_id: "pay_late" }
      expect(pending_ids).to eq(["pay_late"])
      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
    end

    it "reads a singular review from earlier code and migrates it on the next write" do
      invoice.update!(payment_infos: invoice.payment_infos.merge("razorpay_payment_review" => {
        "payment_id" => "pay_legacy", "payment_link_id" => "plink_oauth", "amount" => 100_000, "reason" => "webhook_mismatch"
      }))
      expect(review.pending_for(company)).to contain_exactly(a_hash_including(review_id: "pay_legacy", currency: "INR"))
      flag("pay_new")
      expect(pending_ids).to contain_exactly("pay_legacy", "pay_new")
      expect(invoice.reload.payment_infos).not_to have_key("razorpay_payment_review")
    end
  end

  describe "resolving one review" do
    it "leaves another review and the link binding, and does not re-add it on replay" do
      flag("pay_one")
      flag("pay_two")
      resolve("pay_one")
      expect(response).to have_http_status(:ok)
      expect(pending_ids).to eq(["pay_two"])
      expect(invoice.razorpay_payment_link_id).to eq("plink_oauth")
      expect(a_request(:any, %r{api\.razorpay\.com})).not_to have_been_made

      invoice.update!(payment_infos: invoice.payment_infos.merge("razorpay_payment_link_id" => "plink_other"))
      post_razorpay_oauth_event(capture_event("pay_one", link_id: "plink_oauth"))
      expect(pending_ids).to eq(["pay_two"])
    end

    it "cancels a payable link before clearing its binding" do
      flag("pay_one")
      stub_fetch(link)
      cancel = stub_request(:post, "#{links_url}/plink_oauth/cancel").to_return(status: 200, body: link.merge(status: "cancelled").to_json, headers: json)
      resolve("pay_one")
      expect(response).to have_http_status(:ok)
      expect(cancel).to have_been_requested
      expect(pending_ids).to be_empty
      expect(invoice.razorpay_payment_link_id).to be_nil
      expect(invoice.razorpay_payment_link_status).to eq("cancelled")
    end

    it "keeps the review and binding when the cancel fails" do
      flag("pay_one")
      stub_fetch(link)
      stub_request(:post, "#{links_url}/plink_oauth/cancel").to_return(status: 502,
        body: { error: { code: "SERVER_ERROR", description: "synthetic" } }.to_json, headers: json)
      resolve("pay_one")
      expect(response).to have_http_status(:conflict)
      expect(pending_ids).to eq(["pay_one"])
      expect(invoice.razorpay_payment_link_id).to eq("plink_oauth")
    end

    it "keeps the review and binding when the cancel times out" do
      flag("pay_one")
      stub_fetch(link)
      stub_request(:post, "#{links_url}/plink_oauth/cancel").to_timeout
      resolve("pay_one")
      expect(response).to have_http_status(:conflict)
      expect(pending_ids).to eq(["pay_one"])
      expect(invoice.razorpay_payment_link_id).to eq("plink_oauth")
    end

    it "does not accept a cancellation for a different link" do
      flag("pay_one")
      stub_fetch(link)
      stub_request(:post, "#{links_url}/plink_oauth/cancel").to_return(status: 200,
        body: link.merge(id: "plink_other", status: "cancelled").to_json, headers: json)
      resolve("pay_one")
      expect(response).to have_http_status(:conflict)
      expect(pending_ids).to eq(["pay_one"])
      expect(invoice.razorpay_payment_link_id).to eq("plink_oauth")
    end

    it "can close the original link after an invoice currency correction" do
      flag("pay_one")
      invoice.update!(currency: "USD")
      stub_fetch(link)
      cancel = stub_request(:post, "#{links_url}/plink_oauth/cancel").to_return(status: 200,
        body: link.merge(status: "cancelled").to_json, headers: json)
      resolve("pay_one")
      expect(response).to have_http_status(:ok)
      expect(cancel).to have_been_requested
      expect(pending_ids).to be_empty
    end

    it "retains the review if the owner loses access while Razorpay responds" do
      flag("pay_one")
      stub_fetch(link)
      stub_request(:post, "#{links_url}/plink_oauth/cancel").to_return do
        employment.update!(resigned_at: Date.yesterday)
        { status: 200, body: link.merge(status: "cancelled").to_json, headers: json }
      end
      resolve("pay_one")
      expect(response).to have_http_status(:conflict)
      expect(pending_ids).to eq(["pay_one"])
      expect(invoice.razorpay_payment_link_id).to eq("plink_oauth")
    end

    it "retains a replacement account binding committed while Razorpay responds" do
      flag("pay_one")
      stub_fetch(link)
      stub_request(:post, "#{links_url}/plink_oauth/cancel").to_return do
        Invoice.find(invoice.id).update!(razorpay_payment_link_account_id: "acc_replacement")
        { status: 200, body: link.merge(status: "cancelled").to_json, headers: json }
      end
      resolve("pay_one")
      expect(response).to have_http_status(:conflict)
      expect(pending_ids).to eq(["pay_one"])
      expect(invoice.razorpay_payment_link_account_id).to eq("acc_replacement")
    end

    it "keeps a capture that arrives during the cancel, along with the binding" do
      flag("pay_one")
      stub_fetch(link)
      stub_request(:post, "#{links_url}/plink_oauth/cancel").to_return do
        flag("pay_arrived", Invoice.find(invoice.id))
        { status: 200, body: link.merge(status: "cancelled").to_json, headers: json }
      end
      resolve("pay_one")
      expect(response).to have_http_status(:ok)
      expect(pending_ids).to eq(["pay_arrived"])
      expect(invoice.razorpay_payment_link_id).to eq("plink_oauth")
    end

    it "records a capture returned instead of a cancellation" do
      flag("pay_one")
      stub_fetch(link)
      stub_request(:post, "#{links_url}/plink_oauth/cancel").to_return(status: 200,
        body: paid_link.merge(payments: [{ payment_id: "pay_arrived", status: "captured", amount: 100_000 }]).to_json, headers: json)
      resolve("pay_one")
      expect(response).to have_http_status(:ok)
      expect(pending_ids).to eq(["pay_arrived"])
      expect(invoice.razorpay_payment_link_id).to eq("plink_oauth")
    end

    it "retains an unknown-capture placeholder when Razorpay reports a paid link without payment IDs" do
      flag("pay_one")
      stub_fetch(paid_link)
      resolve("pay_one")
      expect(response).to have_http_status(:ok)
      expect(pending_ids).to eq(["link:plink_oauth"])
      expect(invoice.razorpay_payment_link_id).to eq("plink_oauth")
      expect(review.pending_for(company)).to contain_exactly(a_hash_including(amount: nil, display_amount: nil))
    end

    it "does not reopen a paid invoice or call Razorpay" do
      settled_elsewhere
      flag("pay_late")
      resolve("pay_late")
      expect(response).to have_http_status(:ok)
      expect(invoice.reload).to be_paid
      expect(invoice.razorpay_payment_link_id).to eq("plink_oauth")
      expect(a_request(:any, %r{api\.razorpay\.com})).not_to have_been_made
    end

    it "lets an owner clear a review on a deleted invoice" do
      invoice.discard!
      flag("pay_late")
      resolve("pay_late")
      expect(response).to have_http_status(:ok)
      expect(pending_ids).to be_empty
    end

    it "requires the review ID" do
      flag("pay_one")
      resolve("")
      expect(response).to have_http_status(:not_found)
      expect(pending_ids).to eq(["pay_one"])
    end

    it "returns not found for an invoice with no payment information" do
      invoice.update_columns(payment_infos: nil)
      resolve("pay_missing")
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "what the customer is told" do
    def start_payment
      get new_invoice_payment_path(invoice_id: invoice.external_view_key)
    end

    it "blocks another provider while an existing Razorpay capture needs review" do
      flag("pay_one")
      provider.update!(enabled: false)
      create(:stripe_connected_account, company:)
      client.update!(stripe_id: "cus_synthetic")
      allow(Stripe::Account).to receive(:retrieve).and_return(Struct.new(:details_submitted).new(true))
      allow(Stripe::Checkout::Session).to receive(:create).and_return(Struct.new(:url, :payment_intent).new("https://checkout.stripe.com/synthetic", "pi_synthetic"))
      start_payment
      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
      expect(Stripe::Checkout::Session).not_to have_received(:create)
    end

    it "does not expose a Stripe session if a capture is flagged while Stripe responds" do
      invoice.update!(payment_infos: {})
      provider.update!(enabled: false)
      create(:stripe_connected_account, company:)
      client.update!(stripe_id: "cus_synthetic")
      allow(Stripe::Account).to receive(:retrieve).and_return(Struct.new(:details_submitted).new(true))
      allow(Stripe::Checkout::Session).to receive(:create) do
        flag("pay_arrived", Invoice.find(invoice.id))
        Struct.new(:url, :payment_intent).new("https://checkout.stripe.com/synthetic", "pi_synthetic")
      end
      start_payment
      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
      expect(pending_ids).to eq(["pay_arrived"])
    end

    it "keeps callback capture evidence when invoice validation prevents settlement" do
      invoice.update_columns(due_date: invoice.issue_date - 1.day)
      stub_fetch(paid_link.merge(payments: [{ payment_id: "pay_invalid", status: "captured", amount: 100_000 }]))
      get razorpay_success_invoice_payments_path(invoice_id: invoice.external_view_key),
        params: { razorpay_payment_link_id: "plink_oauth", razorpay_payment_link_status: "paid", razorpay_payment_id: "pay_invalid" }
      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
      expect(invoice.reload).not_to be_paid
      expect(invoice.payments).to be_empty
      expect(pending_ids).to eq(["pay_invalid"])
    end

    it "rolls back an invalid settlement inside link reconciliation without losing capture evidence" do
      invoice.update_columns(due_date: invoice.issue_date - 1.day)
      stub_fetch(paid_link.merge(payments: [{ payment_id: "pay_invalid", status: "captured", amount: 100_000 }]))
      start_payment
      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
      expect(invoice.reload).not_to be_paid
      expect(invoice.payments).to be_empty
      expect(pending_ids).to eq(["pay_invalid"])
    end

    it "confirms a callback for an invoice already deleted before the customer returned" do
      invoice.discard!
      stub_fetch(paid_link.merge(payments: [{ payment_id: "pay_deleted", status: "captured", amount: 100_000 }]))
      get razorpay_success_invoice_payments_path(invoice_id: invoice.external_view_key),
        params: { razorpay_payment_link_id: "plink_oauth", razorpay_payment_link_status: "paid", razorpay_payment_id: "pay_deleted" }
      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
      follow_redirect!
      expect(response.body).to include("Payment needs confirmation")
      expect(response.body).not_to include("Back to invoice")
      expect(invoice.reload.payments).to be_empty
      expect(pending_ids).to eq(["pay_deleted"])
    end

    it "does not settle a callback when the invoice was deleted while Razorpay responded" do
      stub_request(:get, "#{links_url}/plink_oauth").to_return do
        Invoice.find(invoice.id).discard!
        { status: 200, body: paid_link.merge(payments: [{ payment_id: "pay_late", status: "captured", amount: 100_000 }]).to_json, headers: json }
      end
      get razorpay_success_invoice_payments_path(invoice_id: invoice.external_view_key),
        params: { razorpay_payment_link_id: "plink_oauth", razorpay_payment_link_status: "paid", razorpay_payment_id: "pay_late" }
      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
      expect(invoice.reload.payments).to be_empty
      expect(review.pending_for(company)).to contain_exactly(a_hash_including(payment_id: "pay_late", reason: "invoice_deleted"))
    end

    it "preserves a capture returned instead of cancelling a stale invoice amount" do
      invoice.update!(amount_due: 600)
      stub_fetch(link)
      stub_request(:post, "#{links_url}/plink_oauth/cancel").to_return(status: 200,
        body: paid_link.merge(payments: [{ payment_id: "pay_racing", status: "captured", amount: 100_000 }]).to_json, headers: json)
      replacement = stub_request(:post, links_url).to_return(status: 200, body: link.merge(id: "plink_replacement").to_json, headers: json)
      start_payment
      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
      expect(replacement).not_to have_been_requested
      expect(invoice.reload.razorpay_payment_link_id).to eq("plink_oauth")
      expect(pending_ids).to eq(["pay_racing"])
    end

    it "says a reviewed payment needs confirmation, never that they were not charged" do
      flag("pay_one")
      start_payment
      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
      follow_redirect!
      expect(response.body).to include("Payment needs confirmation", "do not pay again", "Back to invoice")
      expect(response.body).not_to include("You have not been charged")
    end

    it "says the same when an issued link cannot be checked" do
      stub_request(:get, "#{links_url}/plink_oauth").to_return(status: 502,
        body: { error: { code: "SERVER_ERROR", description: "synthetic" } }.to_json, headers: json)
      start_payment
      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
    end

    it "does not promise no charge after an unconfirmed link creation" do
      invoice.update!(payment_infos: {})
      stub_request(:post, links_url).to_timeout
      start_payment
      follow_redirect!
      expect(response.body).not_to include("You have not been charged")
      expect(response.body).to include("Payment needs confirmation", "do not pay again")
      expect(invoice.reload.payment_infos).to have_key("razorpay_link_creation")
      expect(a_request(:post, links_url)).to have_been_made.once
    end

    it "sends the customer to success when opening a lost paid link settles the invoice" do
      stub_fetch(paid_link.merge(payments: [{ payment_id: "pay_one", status: "captured", amount: 100_000 }]))
      start_payment
      expect(invoice.reload).to be_paid
      expect(response).to redirect_to("http://www.example.com/invoices/#{invoice.external_view_key}/payments/success?provider=razorpay")
    end

    it "says a returning payment that could not be matched is being confirmed" do
      invoice.update!(amount_due: 600)
      stub_fetch(paid_link.merge(payments: [{ payment_id: "pay_one", status: "captured", amount: 100_000 }]))
      get razorpay_success_invoice_payments_path(invoice_id: invoice.external_view_key),
        params: { razorpay_payment_link_id: "plink_oauth", razorpay_payment_link_status: "paid", razorpay_payment_id: "pay_one" }
      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
    end
  end

  describe "closing the link of a settled or deleted invoice" do
    def perform
      CancelRazorpayPaymentLinkJob.perform_now(invoice.id, "plink_oauth", "acc_synthetic")
    end

    it "queues a bound cancellation after the invoice is paid or deleted" do
      invoice
      expect { settled_elsewhere }.to have_enqueued_job(CancelRazorpayPaymentLinkJob).with(invoice.id, "plink_oauth", "acc_synthetic")
    end

    it "queues one for a deleted invoice" do
      invoice
      expect { invoice.discard! }.to have_enqueued_job(CancelRazorpayPaymentLinkJob).with(invoice.id, "plink_oauth", "acc_synthetic").at_least(:once)
    end

    it "does not queue one for an API-key link, which has no account" do
      invoice.update!(payment_infos: invoice.payment_infos.except("razorpay_payment_link_account_id"))
      expect { settled_elsewhere }.not_to have_enqueued_job(CancelRazorpayPaymentLinkJob)
    end

    it "records the cancellation and keeps the references" do
      settled_elsewhere
      stub_fetch(link)
      stub_request(:post, "#{links_url}/plink_oauth/cancel").to_return(status: 200, body: link.merge(status: "cancelled").to_json, headers: json)
      perform
      expect(invoice.reload).to have_attributes(razorpay_payment_link_id: "plink_oauth", razorpay_payment_link_status: "cancelled",
        razorpay_payment_link_account_id: "acc_synthetic")
    end

    it "records a capture it finds instead of losing it" do
      settled_elsewhere
      stub_fetch(paid_link.merge(payments: [{ payment_id: "pay_late", status: "captured", amount: 100_000 }]))
      perform
      expect(pending_ids).to eq(["pay_late"])
      expect(invoice.razorpay_payment_link_status).to eq("paid")
    end

    it "leaves the status unchanged and retries when the cancel fails" do
      settled_elsewhere
      stub_fetch(link)
      stub_request(:post, "#{links_url}/plink_oauth/cancel").to_return(status: 502,
        body: { error: { code: "SERVER_ERROR", description: "synthetic" } }.to_json, headers: json)
      expect { perform }.to have_enqueued_job(CancelRazorpayPaymentLinkJob)
      expect(invoice.reload).to have_attributes(razorpay_payment_link_id: "plink_oauth", razorpay_payment_link_status: "created")
    end

    it "does nothing for a link that is no longer current or an invoice that is still open" do
      perform
      settled_elsewhere
      CancelRazorpayPaymentLinkJob.perform_now(invoice.id, "plink_replaced", "acc_synthetic")
      CancelRazorpayPaymentLinkJob.perform_now(invoice.id, "plink_oauth", "acc_attacker")
      expect(a_request(:any, %r{api\.razorpay\.com})).not_to have_been_made
    end

    it "does not cancel when the connected account differs" do
      settled_elsewhere
      provider.reload.settings["oauth_account_id"] = "acc_other"
      provider.save!
      perform
      expect(a_request(:any, %r{api\.razorpay\.com})).not_to have_been_made
      expect(invoice.reload.razorpay_payment_link_status).to eq("created")
    end

    it "does not cancel a test-mode link through a live-mode connection for the same account" do
      settled_elsewhere
      invoice.update!(razorpay_payment_link_mode: "test")
      provider.reload.update!(settings: provider.settings.merge("oauth_mode" => "live"))
      provider.razorpay_oauth_credentials = provider.razorpay_oauth_credentials.merge(
        "public_token" => "rzp_live_oauth_synthetic", "access_token" => "synthetic-live-access",
        "identity" => provider.razorpay_oauth_credentials.fetch("identity").merge("mode" => "live"))
      provider.save!
      stub_razorpay_oauth_env(MODE: "live")
      perform
      expect(a_request(:any, %r{api\.razorpay\.com})).not_to have_been_made
      expect(invoice.reload.razorpay_payment_link_status).to eq("created")
    end
  end
end

RSpec.describe InvoicePayment::RazorpayOauthPaymentLinkWebhookFulfillment, "stale webhook writes" do
  let(:company) { create(:india_company, base_currency: "INR") }
  let(:client) { create(:client, company:, currency: "INR", name: "Acme", email: "client@example.com") }
  let(:invoice) do
    create(:invoice, company:, client:, currency: "INR", amount: 1000, amount_due: 1000, amount_paid: 0, status: "sent",
      payment_infos: { "razorpay_payment_link_id" => "plink_old", "razorpay_payment_link_url" => "https://rzp.io/rzp/old",
                       "razorpay_payment_link_status" => "created", "razorpay_payment_link_account_id" => "acc_synthetic" })
  end

  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
    @threads = []
  end

  after do
    @threads.each { |thread| thread.kill if thread.alive? }
    @threads.each(&:join)
  end

  def on_own_connection(label = nil)
    parent_pid = ActiveRecord::Base.connection.select_value("SELECT pg_backend_pid()")
    @threads << Thread.new do
      Thread.current.report_on_exception = false
      ActiveRecord::Base.connection_pool.with_connection do |database|
        expect(database.select_value("SELECT pg_backend_pid()")).not_to eq(parent_pid)
        expect(Invoice.connection).to equal(database)
        database.execute("SET application_name = #{database.quote(label)}") if label
        yield database
      ensure
        database.execute("RESET application_name")
      end
    end
    @threads.last
  end

  def cancelled_event_on_own_connection
    payload = { event: "payment_link.cancelled", account_id: "acc_synthetic",
                payload: { payment_link: { entity: { id: "plink_old", status: "cancelled" } } } }.to_json
    started = Queue.new
    thread = on_own_connection("miru_oauth_stale_webhook") do |database|
      started << database.select_value("SELECT pg_backend_pid()")
      described_class.new(payload:, signature: "verified-by-caller", account_id: "acc_synthetic").process
    end
    @webhook_pid = Timeout.timeout(5) { started.pop }
    thread
  end

  def wait_for_webhook_to_block
    Timeout.timeout(5) do
      loop do
        break if ActiveRecord::Base.connection.select_value(
          "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid = #{Integer(@webhook_pid)} AND datname = current_database() " \
          "AND application_name = 'miru_oauth_stale_webhook' AND wait_event_type = 'Lock')")

        Thread.pass
      end
    end
  end

  # The webhook reads plink_old while the holder's change is uncommitted, then blocks on the row lock.
  def race_webhook_against_uncommitted_change
    invoice_id = invoice.id
    entered, release = Queue.new, Queue.new
    holder = on_own_connection do
      record = Invoice.find(invoice_id)
      record.with_lock do
        yield record
        entered << true
        release.pop
      end
    end
    Timeout.timeout(5) { entered.pop }
    webhook = cancelled_event_on_own_connection
    wait_for_webhook_to_block
    release << true
    expect(Timeout.timeout(5) { [holder.value, webhook.value] }.last).to be(true)
  ensure
    release << true
  end

  it "does not overwrite a replacement link committed while it waited for the lock" do
    race_webhook_against_uncommitted_change do |record|
      record.update!(payment_infos: record.payment_infos.merge("razorpay_payment_link_id" => "plink_new",
        "razorpay_payment_link_url" => "https://rzp.io/rzp/new", "razorpay_payment_link_status" => "created"))
    end
    expect(invoice.reload).to have_attributes(razorpay_payment_link_id: "plink_new", razorpay_payment_link_url: "https://rzp.io/rzp/new",
      razorpay_payment_link_status: "created")
  end

  it "does not erase a review committed while it waited for the lock" do
    race_webhook_against_uncommitted_change do |record|
      PaymentProviders::RazorpayPaymentReview.flag!(record, payment_id: "pay_racing", payment_link_id: "plink_old", amount: 100_000, reason: "webhook_mismatch", currency: "INR")
    end
    expect(PaymentProviders::RazorpayPaymentReview.reviews_for(invoice.reload).keys).to eq(["pay_racing"])
    expect(invoice.razorpay_payment_link_id).to be_nil
  end
end
