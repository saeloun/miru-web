# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Production credential key validation" do
  def load_initializer
    load Rails.root.join("config/initializers/production_secret_key_base.rb")
  end

  before do
    allow(Rails.env).to receive(:production?).and_return(true)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("SECRET_KEY_BASE_DUMMY").and_return(nil)
    allow(ENV).to receive(:[]).with("SECRET_KEY_BASE").and_return("synthetic-stable-session-key")
    allow(ENV).to receive(:[]).with("PROVIDER_CREDENTIALS_ENCRYPTION_SECRET").and_return(nil)
  end

  it "rejects known placeholder provider secrets with a constant error" do
    (%w[dummy DUMMY changeme change-me placeholder Dummy CHANGEME CHANGE-ME PLACEHOLDER] + [" changeme ", "\tDUMMY\n"]).each do |value|
      allow(ENV).to receive(:[]).with("PROVIDER_CREDENTIALS_ENCRYPTION_SECRET").and_return(value)

      expect { load_initializer }.to raise_error(RuntimeError,
        "PROVIDER_CREDENTIALS_ENCRYPTION_SECRET must not be a placeholder. Preserve the existing credential encryption secret.")
    end
  end

  it "allows unset or blank provider secrets to retain the signing-key fallback" do
    [nil, "", " "].each do |value|
      allow(ENV).to receive(:[]).with("PROVIDER_CREDENTIALS_ENCRYPTION_SECRET").and_return(value)

      expect { load_initializer }.not_to raise_error
    end
  end

  it "allows a stable provider secret independent of the current signing key" do
    allow(ENV).to receive(:[]).with("PROVIDER_CREDENTIALS_ENCRYPTION_SECRET").and_return("synthetic-original-credential-key")

    expect { load_initializer }.not_to raise_error
  end

  it "retains the mandatory production signing-key validation" do
    [nil, "", "dummy", "DUMMY", "changeme", "change-me", "placeholder"].each do |value|
      allow(ENV).to receive(:[]).with("SECRET_KEY_BASE").and_return(value)

      expect { load_initializer }.to raise_error(RuntimeError,
        "SECRET_KEY_BASE must be set to a stable production secret. Changing it invalidates all Rails sessions.")
    end
  end

  it "preserves the dummy-key build exemption" do
    allow(ENV).to receive(:[]).with("SECRET_KEY_BASE_DUMMY").and_return("1")
    allow(ENV).to receive(:[]).with("PROVIDER_CREDENTIALS_ENCRYPTION_SECRET").and_return("changeme")

    expect { load_initializer }.not_to raise_error
  end

  it "does not apply the production validation in other environments" do
    allow(Rails.env).to receive(:production?).and_return(false)
    allow(ENV).to receive(:[]).with("PROVIDER_CREDENTIALS_ENCRYPTION_SECRET").and_return("changeme")

    expect { load_initializer }.not_to raise_error
  end
end
