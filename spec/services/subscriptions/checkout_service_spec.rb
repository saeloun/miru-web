# frozen_string_literal: true

require "rails_helper"

RSpec.describe Subscriptions::CheckoutService do
  let(:company) { create(:company, stripe_customer_id: "cus_checkout") }
  let(:user) { create(:user, current_workspace_id: company.id) }

  def collection(items)
    Stripe::ListObject.construct_from(data: items, has_more: false)
  end

  def session(id: "cs_open", status: "open", subscription: nil)
    Stripe::Checkout::Session.construct_from(
      id:, status:, subscription:, mode: "subscription", created: 1, url: "https://checkout.stripe.com/#{id}"
    )
  end

  def checkout(target = company)
    described_class.new(company: target, user:, price_id: "price_monthly", interval: "monthly", base_url: "http://localhost").process
  end

  before do
    allow(Stripe::Subscription).to receive(:list).and_return(collection([]))
    allow(Stripe::Checkout::Session).to receive(:list).and_return(collection([]))
    allow(Stripe::Checkout::Session).to receive(:create).and_return(session)
    allow(Stripe::Checkout::Session).to receive(:list_line_items).and_return(
      collection([Stripe::StripeObject.construct_from(price: { id: "price_monthly" }, quantity: 1)])
    )
    allow(Stripe::Checkout::Session).to receive(:expire)
  end

  it "reuses an abandoned open checkout instead of creating another payable session" do
    allow(Stripe::Checkout::Session).to receive(:list).and_return(collection([session]))
    expect(checkout.id).to eq("cs_open")
    expect(Stripe::Checkout::Session).not_to have_received(:create)
  end

  it "allows a new attempt after expiration with a stable retry key" do
    allow(Stripe::Checkout::Session).to receive(:list).and_return(collection([session(id: "cs_expired", status: "expired")]))
    2.times { checkout }
    expect(Stripe::Checkout::Session).to have_received(:create).twice.with(
      anything, { idempotency_key: "company-#{company.id}-checkout-after-cs_expired" }
    )
  end

  it "expires a checkout for a different plan before replacing it" do
    allow(Stripe::Checkout::Session).to receive(:list).and_return(collection([session]))
    allow(Stripe::Checkout::Session).to receive(:list_line_items).and_return(
      collection([Stripe::StripeObject.construct_from(price: { id: "price_yearly" }, quantity: 1)])
    )
    expect(Stripe::Checkout::Session).to receive(:expire).with("cs_open").ordered
    expect(Stripe::Checkout::Session).to receive(:create).ordered.and_return(session(id: "cs_replacement"))
    expect(checkout.id).to eq("cs_replacement")
  end

  it "expires a checkout with an outdated seat count before replacing it" do
    allow(Stripe::Checkout::Session).to receive(:list).and_return(collection([session]))
    allow(Stripe::Checkout::Session).to receive(:list_line_items).and_return(
      collection([Stripe::StripeObject.construct_from(price: { id: "price_monthly" }, quantity: 2)])
    )
    checkout
    expect(Stripe::Checkout::Session).to have_received(:expire).with("cs_open")
    expect(Stripe::Checkout::Session).to have_received(:create).once
  end

  it "does not replace a checkout that completes during expiration" do
    allow(Stripe::Checkout::Session).to receive(:list).and_return(collection([session]))
    allow(Stripe::Checkout::Session).to receive(:list_line_items).and_return(collection([]))
    allow(Stripe::Checkout::Session).to receive(:expire).and_raise(Stripe::InvalidRequestError.new("already completed", "id"))
    expect { checkout }.to raise_error(Stripe::InvalidRequestError)
    expect(Stripe::Checkout::Session).not_to have_received(:create)
  end

  it "recovers a remotely created session after the first response is lost" do
    allow(Stripe::Checkout::Session).to receive(:create) do
      allow(Stripe::Checkout::Session).to receive(:list).and_return(collection([session]))
      raise Stripe::APIConnectionError, "response lost"
    end
    expect { checkout }.to raise_error(Stripe::APIConnectionError)
    expect(checkout.id).to eq("cs_open")
    expect(Stripe::Checkout::Session).to have_received(:create).once
  end

  it "blocks checkout completed between the subscription and session reads" do
    allow(Stripe::Checkout::Session).to receive(:list).and_return(collection([session(status: "complete", subscription: "sub_new")]))
    expect(checkout).to be_nil
    expect(Stripe::Checkout::Session).not_to have_received(:create)
  end

  it "blocks another checkout for an incomplete subscription" do
    subscription = Stripe::Subscription.construct_from(id: "sub_incomplete", customer: "cus_checkout", status: "incomplete", created: 1)
    allow(Stripe::Subscription).to receive(:list).and_return(collection([subscription]))
    expect(checkout).to be_nil
    expect(company.reload.plan_tier).to eq("free")
    expect(Stripe::Checkout::Session).not_to have_received(:create)
  end

  it "fails closed when Stripe cannot verify existing subscriptions" do
    allow(Stripe::Subscription).to receive(:list).and_raise(Stripe::APIConnectionError, "offline")
    expect { checkout }.to raise_error(Stripe::APIConnectionError)
    expect(Stripe::Checkout::Session).not_to have_received(:create)
  end

  it "never starts paid checkout for complimentary Pro" do
    company.update!(billing_exempt: true)
    expect(checkout).to be_nil
    expect(Stripe::Subscription).not_to have_received(:list)
    expect(Stripe::Checkout::Session).not_to have_received(:create)
  end

  context "with concurrent callers" do
    before do
      # Threads need committed fixtures and separate PostgreSQL connections.
      DatabaseCleaner.clean
    end

    after { DatabaseCleaner.clean_with(:deletion) }

    it "returns one session to eight simultaneous callers under a forced creation delay" do
      company.update!(stripe_customer_id: nil)
      company_id = company.id
      user
      ready, start = Queue.new, Queue.new
      remote_sessions = []
      mutex = Mutex.new
      allow(Stripe::Customer).to receive(:create).and_return(Stripe::Customer.construct_from(id: "cus_checkout"))
      allow(Stripe::Checkout::Session).to receive(:list) { mutex.synchronize { collection(remote_sessions.dup) } }
      allow(Stripe::Checkout::Session).to receive(:create) do
        sleep 0.05 # Widen the check/create window; database locking must close it.
        mutex.synchronize { remote_sessions << session; remote_sessions.last }
      end
      threads = 8.times.map do
        Thread.new do
          ready << true
          start.pop
          ActiveRecord::Base.connection_pool.with_connection { checkout(Company.find(company_id)).id }
        end
      end
      8.times { ready.pop }
      8.times { start << true }

      expect(threads.map(&:value)).to eq(Array.new(8, "cs_open"))
      expect(Stripe::Customer).to have_received(:create).once
      expect(Stripe::Checkout::Session).to have_received(:create).once
      expect(Company.find(company_id).stripe_customer_id).to eq("cus_checkout")
    end
  end
end
