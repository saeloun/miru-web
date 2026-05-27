import { test, expect } from "@playwright/test";

test.use({ storageState: "e2e/.auth/admin.json" });

test("debug API calls", async ({ request }) => {
    // Test 1: Get current user info
    console.log("\n=== Testing /api/v1/users/_me ===");
    const meRes = await request.get("/api/v1/users/_me");
    console.log("Status:", meRes.status());
    const meData = await meRes.json();
    console.log("User ID:", meData.user?.id);
    console.log("Company ID:", meData.company?.id);

    const userId = String(meData.user.id);
    const companyId = String(meData.company.id);

    // Test 2: Get projects
    console.log("\n=== Testing /api/v1/projects ===");
    const projectsRes = await request.get("/api/v1/projects");
    console.log("Status:", projectsRes.status());
    const projectsData = await projectsRes.json();
    console.log("Projects found:", projectsData.projects?.length || 0);
    if (projectsData.projects?.length > 0) {
        console.log("First project ID:", projectsData.projects[0].id);
        console.log("First project name:", projectsData.projects[0].name);
    }

    const projectId = projectsData.projects?.[0]?.id;

    // Test 3: Try to create a timesheet entry
    if (projectId) {
        console.log("\n=== Testing POST /api/v1/timesheet_entry ===");
        console.log("Using user_id:", userId);
        console.log("Using project_id:", projectId);

        // Calculate last Monday's date
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek + 6; // Get previous Monday
        const lastMonday = new Date(today);
        lastMonday.setDate(today.getDate() - daysToSubtract);
        const workDate = lastMonday.toISOString().split('T')[0];
        console.log("Using work_date:", workDate);

        const entryRes = await request.post(`/api/v1/timesheet_entry?user_id=${userId}`, {
            data: {
                project_id: projectId,
                timesheet_entry: {
                    work_date: workDate,
                    duration: 480, // 8 hours in minutes
                    note: "Debug test entry",
                    bill_status: "billable",
                },
            },
        });

        console.log("Status:", entryRes.status());
        if (entryRes.ok()) {
            const entryData = await entryRes.json();
            console.log("Response:", JSON.stringify(entryData, null, 2));
        } else {
            const errorText = await entryRes.text();
            // Try to extract the error message from the HTML
            const errorMatch = errorText.match(/<h2>(.*?)<\/h2>/);
            if (errorMatch) {
                console.log("Error:", errorMatch[1]);
            }
            console.log("Error response (first 1000 chars):", errorText.substring(0, 1000));
        }
    }

    // Test 4: Get notification preferences
    console.log("\n=== Testing GET /api/v1/team/:id/notification_preferences ===");
    const prefRes = await request.get(`/api/v1/team/${userId}/notification_preferences`);
    console.log("Status:", prefRes.status());
    const prefData = await prefRes.json();
    console.log("Response:", JSON.stringify(prefData, null, 2));
});
