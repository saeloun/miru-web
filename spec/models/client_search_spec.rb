# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client search functionality" do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }

  describe "Client.search" do
    let!(:apple) { create(:client, name: "Apple Inc", email: "contact@apple.com", company: company) }
    let!(:google) { create(:client, name: "Google LLC", email: "info@google.com", company: company) }
    let!(:microsoft) { create(:client, name: "Microsoft Corp", email: "support@microsoft.com", company: company) }
    let!(:amazon) { create(:client, name: "Amazon Web Services", email: "aws@amazon.com", company: company) }
    let!(:other_company_client) { create(:client, name: "Apple Store", company: company2) }

    describe "basic search" do
      it "finds clients by exact name" do
        results = Client.search("Google LLC")
        expect(results).to include(google)
        expect(results).not_to include(apple, microsoft, amazon)
      end

      it "finds clients by partial name" do
        results = Client.search("Apple")
        expect(results).to include(apple, other_company_client)
        expect(results).not_to include(google, microsoft)
      end

      it "finds clients by email domain" do
        results = Client.search("google.com")
        expect(results).to include(google)
        expect(results.count).to eq(1)
      end

      it "finds multiple clients with common term" do
        results = Client.search("Corp")
        expect(results).to include(microsoft)
        expect(results).not_to include(apple, google)
      end

      it "returns empty for non-matching search" do
        results = Client.search("Facebook")
        expect(results).to be_empty
      end
    end

    describe "with company filtering" do
      it "filters by company_id" do
        results = Client.search("Apple", where: { company_id: company.id })
        expect(results).to include(apple)
        expect(results).not_to include(other_company_client)
      end

      it "searches across all companies when not filtered" do
        results = Client.search("Apple")
        expect(results).to include(apple, other_company_client)
      end
    end

    describe "with discarded clients" do
      let!(:discarded_client) { create(:client, name: "Discarded Inc", company: company, discarded_at: Time.current) }

      it "excludes discarded by default when filtered" do
        results = Client.search("", where: { discarded_at: nil })
        expect(results).to include(apple, google, microsoft, amazon)
        expect(results).not_to include(discarded_client)
      end

      it "includes discarded when not filtered" do
        results = Client.search("Discarded")
        expect(results).to include(discarded_client)
      end

      it "finds only discarded clients when filtered" do
        results = Client.search("", where: { discarded_at: 1.day.ago..Time.current })
        expect(results).to include(discarded_client)
        expect(results).not_to include(apple, google)
      end
    end

    describe "ordering and pagination" do
      it "orders alphabetically by name" do
        results = Client.search("", order: { name: :asc })
        names = results.pluck(:name)
        expect(names).to eq(names.sort)
      end

      it "orders by creation date" do
        microsoft.update!(created_at: 1.day.ago)
        results = Client.search("", order: { created_at: :desc })
        expect(results.first).to eq(other_company_client)
      end

      it "paginates results" do
        results = Client.search("", page: 1, per: 2)
        expect(results.count).to eq(2)

        results_page2 = Client.search("", page: 2, per: 2)
        expect(results_page2.count).to eq(2)
        expect(results.pluck(:id)).not_to eq(results_page2.pluck(:id))
      end
    end

    describe "case sensitivity" do
      it "is case insensitive for name" do
        expect(Client.search("apple")).to include(apple)
        expect(Client.search("APPLE")).to include(apple)
        expect(Client.search("Apple")).to include(apple)
      end

      it "is case insensitive for email" do
        expect(Client.search("CONTACT@APPLE.COM")).to include(apple)
      end
    end

    describe "special characters" do
      let!(:special_client) { create(:client, name: "O'Reilly & Associates", email: "info@oreilly.com", company: company) }

      it "handles apostrophes and ampersands" do
        results = Client.search("O'Reilly")
        expect(results).to include(special_client)

        results = Client.search("& Associates")
        expect(results).to include(special_client)
      end
    end

    describe "with associated data" do
      before do
        create(:project, client: apple, name: "iOS Development")
        create(:project, client: google, name: "Android App")
      end

      it "includes associations when specified" do
        # TODO: implement includes option in Searchable concern
        results = Client.search("", includes: [:projects])
        expect(results.first.association(:projects)).to be_loaded
      end
    end

    describe "field-specific search" do
      it "searches only in name field" do
        # TODO: implement fields option in Searchable concern
        results = Client.search("apple", fields: [:name])
        expect(results).to include(apple, other_company_client)

        results = Client.search("apple.com", fields: [:name])
        expect(results).to be_empty
      end

      it "searches only in email field" do
        # TODO: implement fields option in Searchable concern
        results = Client.search("apple", fields: [:email])
        expect(results).to include(apple)
        expect(results).not_to include(other_company_client) # has no apple in email
      end
    end
  end
end
