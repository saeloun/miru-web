# frozen_string_literal: true

require "rails_helper"

RSpec.describe NativeGoogleAuthRequest, type: :model do
  let(:verifier) { SecureRandom.urlsafe_base64(32) }
  let(:challenge) { Base64.urlsafe_encode64(Digest::SHA256.digest(verifier), padding: false) }
  let(:state) { SecureRandom.hex(32) }
  let(:binding) { SecureRandom.hex(32) }
  let(:user) { create(:user, current_workspace: nil) }
  let(:issued) { described_class.issue!(intent: "signup", code_challenge: challenge, state:) }
  let(:record) { issued.first }

  before do
    allow(HubspotIntegrationJob).to receive(:perform_later)
    stub_request(:get, %r{\Ahttps://api\.pwnedpasswords\.com/range/}).to_return(status: 200, body: "")
  end

  def authorize_record
    record.bind_browser!(binding)
    record.complete!(binding:) { [user, nil, "needs_workspace"] }
  end

  it "stores only digests of request and handoff codes" do
    code = authorize_record
    expect(record.request_digest).not_to eq(issued.last)
    expect(record.code_digest).not_to eq(code)
    expect(record.request_digest).to eq(described_class.digest(issued.last))
    expect(record.code_digest).to eq(described_class.digest(code))
  end

  it "binds the browser once and rejects a second start" do
    record.bind_browser!(binding)
    expect { record.bind_browser!(SecureRandom.hex(32)) }.to raise_error(described_class::InvalidHandoff)
  end

  it "rejects a callback from another browser" do
    record.bind_browser!(binding)
    expect { record.complete!(binding: SecureRandom.hex(32)) { [user, nil, "needs_workspace"] } }
      .to raise_error(described_class::InvalidHandoff)
    expect(record.reload.outcome).to be_nil
  end

  it "rejects duplicate callback completion" do
    authorize_record
    expect { record.complete!(binding:) { [user, nil, "needs_workspace"] } }
      .to raise_error(described_class::InvalidHandoff)
  end

  it "atomically consumes one correct PKCE exchange and rejects replay" do
    code = authorize_record
    expect(record.exchange!(code:, verifier:) { :completed }).to eq(:completed)
    expect(record.reload.consumed_at).to be_present
    expect { record.exchange!(code:, verifier:) { :replayed } }.to raise_error(described_class::InvalidHandoff)
  end

  it "allows exactly one concurrent exchange against committed PostgreSQL records" do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    code = authorize_record
    id = record.id
    barrier = Queue.new
    results = Queue.new
    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.pop
          begin
            described_class.find(id).exchange!(code:, verifier:) { :accepted }
            results << :accepted
          rescue described_class::InvalidHandoff
            results << :rejected
          end
        end
      end
    end
    2.times { barrier << true }
    threads.each { |thread| expect(thread.join(10)).not_to be_nil }
    expect(2.times.map { results.pop }).to match_array([:accepted, :rejected])
  ensure
    Array(threads).each { |thread| thread.kill if thread.alive? }
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :transaction
    DatabaseCleaner.start
  end

  it "invalidates the grant when its user is permanently deleted" do
    code = authorize_record
    token = issued.last
    user.destroy!
    expect { described_class.find_request!(token) }.to raise_error(described_class::InvalidHandoff)
    expect(described_class.where(code_digest: described_class.digest(code))).to be_empty
  end

  it "does not consume the grant for incorrect PKCE" do
    code = authorize_record
    expect { record.exchange!(code:, verifier: SecureRandom.urlsafe_base64(32)) { :wrong } }
      .to raise_error(described_class::InvalidHandoff)
    expect(record.reload.consumed_at).to be_nil
    expect(record.exchange!(code:, verifier:) { :correct }).to eq(:correct)
  end

  it "rejects expired handoff codes and the exact expiry boundary" do
    code = authorize_record
    travel_to(record.reload.code_expires_at, with_usec: true) do
      expect { record.exchange!(code:, verifier:) { :expired } }.to raise_error(described_class::InvalidHandoff)
    end
  end

  it "rejects an expired browser request before callback resolution" do
    record.bind_browser!(binding)
    travel_to(record.reload.expires_at, with_usec: true) do
      expect { record.complete!(binding:) { raise "must not resolve account" } }
        .to raise_error(described_class::InvalidHandoff)
    end
  end

  it "rejects an account whose authentication state changes after authorization" do
    code = authorize_record
    user.update!(otp_required_for_login: true)
    expect { record.exchange!(code:, verifier:) { :stale } }.to raise_error(described_class::InvalidHandoff)
  end

  it "rejects cancellation without authorizing a grant" do
    record.bind_browser!(binding)
    record.cancel!(binding:)
    expect { record.complete!(binding:) { [user, nil, "needs_workspace"] } }
      .to raise_error(described_class::InvalidHandoff)
  end

  it "rejects missing authentication state without a server error or consumed grant" do
    code = authorize_record
    user.update_columns(token: nil)
    expect { record.exchange!(code:, verifier:) { :invalid } }
      .to raise_error(described_class::InvalidHandoff)
    expect(record.reload.consumed_at).to be_nil
  end

  it "rejects malformed challenge, state, intent and verifier inputs" do
    [
      { code_challenge: "short" }, { code_challenge: "=" * 43 },
      { state: "short" }, { state: "a" * 129 }, { intent: "link" }
    ].each do |bad|
      expect { described_class.issue!(**{ intent: "signup", code_challenge: challenge, state: }.merge(bad)) }
        .to raise_error(described_class::InvalidHandoff)
    end
    code = authorize_record
    expect { record.exchange!(code:, verifier: "x" * 42) { :bad } }
      .to raise_error(described_class::InvalidHandoff)
  end
end
