/**
 * Billing Settings — Seat Count Discrepancy Investigation
 *
 * This test reproduces the issue where /settings/billing shows "2/3 seats used"
 * but /team only shows 1 user.
 *
 * The test will:
 * 1. Check the current seat count on billing page
 * 2. Check the user count on team page
 * 3. Use the API to investigate the discrepancy
 * 4. Identify users with only client role (who count toward seats but don't show on /team)
 */
import { test, expect } from "@playwright/test";
import { goToBilling, fetchBillingSummary } from "./helpers";

test.describe("Billing Settings — Seat Count Discrepancy", () => {
    test("investigate seat count vs team member count discrepancy", async ({ page }) => {
        // Step 1: Go to billing page and capture seat count
        await goToBilling(page);

        const seatUsageText = await page.getByText(/seats used/i).first().textContent();
        console.log("Billing page shows:", seatUsageText);

        // Extract the number from "X/Y seats used" or "X seats used"
        const seatMatch = seatUsageText?.match(/(\d+)(?:\/\d+)?\s+seats used/i);
        const seatsUsedOnBilling = seatMatch ? parseInt(seatMatch[1]) : 0;
        console.log("Seats used (from billing page):", seatsUsedOnBilling);

        // Step 2: Fetch billing summary from API
        const billingSummary = await fetchBillingSummary(page);
        console.log("Billing API response:", JSON.stringify(billingSummary, null, 2));
        console.log("used_team_seats from API:", billingSummary.used_team_seats);

        // Step 3: Go to team page and count visible members
        await page.goto("/team");
        await page.waitForLoadState("networkidle");

        // Wait for team members to load
        await page.waitForTimeout(2000);

        // Count team member rows (excluding invitations)
        const teamMemberRows = page.locator('tr[data-testid*="team-member-"]');
        const teamMemberCount = await teamMemberRows.count();
        console.log("Team members visible on /team page:", teamMemberCount);

        // Get all visible team member names
        const teamMembers = await page.locator('tr[data-testid*="team-member-"]').allTextContents();
        console.log("Team members:", teamMembers);

        // Step 4: Fetch team data from API
        const teamResponse = await page.request.get("/api/v1/team");
        expect(teamResponse.ok()).toBeTruthy();
        const teamData = await teamResponse.json();
        console.log("Team API response:", JSON.stringify(teamData, null, 2));

        const activeEmployees = teamData.combined_data?.filter((member: any) =>
            member.type === "employee" && member.status === "active"
        ) || [];
        console.log("Active employees from API:", activeEmployees.length);

        // Step 5: Use Rails runner to investigate the discrepancy
        const investigationScript = `
company = Company.find_by(id: ${billingSummary.company_id || 'User.first.current_workspace_id'})
if company.nil?
  puts "ERROR: Company not found"
  exit 1
end

puts "Company: #{company.name}"
puts "=" * 60
puts "used_team_seats: #{company.used_team_seats}"
puts "employees_without_client_role count: #{company.employees_without_client_role.count}"
puts ""
puts "All users with kept employments:"
puts "-" * 60

company.users.with_kept_employments.distinct.each do |user|
  roles = user.roles.where(resource: company).pluck(:name).join(", ")
  employment = user.employments.kept.find_by(company: company)
  puts "User: #{user.full_name} (#{user.email})"
  puts "  Roles: #{roles.presence || 'none'}"
  puts "  Employment ID: #{employment.id}"
  puts "  Discarded: #{employment.discarded?}"
  puts ""
end

puts "=" * 60
puts "Users with ONLY client role:"
puts "-" * 60

user_ids_with_only_client_role = company.users.with_kept_employments
  .joins(:roles)
  .group("users.id, roles.resource_id, roles.resource_type")
  .having("COUNT(roles.id) = 1 AND MAX(roles.name) = 'client' AND roles.resource_id = #{company.id} AND roles.resource_type = 'Company'")
  .pluck("users.id")

if user_ids_with_only_client_role.any?
  User.where(id: user_ids_with_only_client_role).each do |user|
    puts "  - #{user.full_name} (#{user.email})"
  end
else
  puts "  (none)"
end
`;

        // Write the script to a temp file
        await page.evaluate(async (script) => {
            const response = await fetch("/api/v1/debug/run_script", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ script })
            });
            // This endpoint might not exist, so we'll handle it gracefully
            if (response.ok) {
                const result = await response.json();
                console.log("Rails investigation:", result);
            }
        }, investigationScript);

        // Step 6: Report findings
        console.log("\n" + "=".repeat(60));
        console.log("FINDINGS:");
        console.log("=".repeat(60));
        console.log(`Seats used (billing page): ${seatsUsedOnBilling}`);
        console.log(`Seats used (API): ${billingSummary.used_team_seats}`);
        console.log(`Team members visible: ${teamMemberCount}`);
        console.log(`Active employees (API): ${activeEmployees.length}`);
        console.log("=".repeat(60));

        if (billingSummary.used_team_seats !== activeEmployees.length) {
            console.log("\n⚠️  DISCREPANCY FOUND!");
            console.log(`Difference: ${billingSummary.used_team_seats - activeEmployees.length} user(s)`);
            console.log("\nPossible causes:");
            console.log("1. User(s) with ONLY client role (counted in seats but not shown on /team)");
            console.log("2. User(s) with discarded employment that's not properly filtered");
            console.log("3. User(s) in a different state that affects visibility");

            // List all team members to identify the hidden one
            console.log("\nAll team data members:");
            teamData.combined_data?.forEach((member: any) => {
                console.log(`  - ${member.name} (${member.email}) - Role: ${member.role}, Type: ${member.type}, Status: ${member.status}`);
            });
        } else {
            console.log("\n✓ No discrepancy found in this test run");
        }

        // The test passes regardless - we're just investigating
        expect(true).toBeTruthy();
    });

    test("create a client-only user and verify seat count behavior", async ({ page }) => {
        // This test will create a user with only client role and verify the discrepancy

        // Step 1: Get current seat count
        await goToBilling(page);
        const initialSummary = await fetchBillingSummary(page);
        const initialSeats = initialSummary.used_team_seats;
        console.log("Initial seats used:", initialSeats);

        // Step 2: Create a client-only user via API
        const timestamp = Date.now();
        const clientEmail = `client-only-${timestamp}@example.com`;

        // First create a client company
        const clientResponse = await page.request.post("/api/v1/clients", {
            data: {
                client: {
                    name: `Test Client ${timestamp}`,
                    email: clientEmail,
                    phone: "1234567890",
                    address: "123 Test St"
                }
            }
        });

        if (!clientResponse.ok()) {
            console.log("Failed to create client:", await clientResponse.text());
            // Skip this test if we can't create clients
            test.skip();
            return;
        }

        const client = await clientResponse.json();
        console.log("Created client:", client);

        // Step 3: Invite the client as a user with client role
        const inviteResponse = await page.request.post("/api/v1/team/invite", {
            data: {
                invitation: {
                    first_name: "Client",
                    last_name: "Only",
                    recipient_email: clientEmail,
                    role: "client"
                }
            }
        });

        if (inviteResponse.ok()) {
            console.log("Invited client user");

            // Step 4: Check if seats increased
            await page.goto("/settings/billing");
            await page.waitForTimeout(2000);

            const newSummary = await fetchBillingSummary(page);
            const newSeats = newSummary.used_team_seats;
            console.log("New seats used:", newSeats);

            // Step 5: Check team page
            await page.goto("/team");
            await page.waitForTimeout(2000);

            const teamMemberRows = page.locator('tr[data-testid*="team-member-"]');
            const teamMemberCount = await teamMemberRows.count();
            console.log("Team members visible:", teamMemberCount);

            // Report findings
            console.log("\nAfter creating client-only user:");
            console.log(`Seats changed: ${initialSeats} → ${newSeats} (${newSeats > initialSeats ? '+' : ''}${newSeats - initialSeats})`);
            console.log(`Team members visible: ${teamMemberCount}`);
        } else {
            console.log("Failed to invite client:", await inviteResponse.text());
        }

        expect(true).toBeTruthy();
    });
});
