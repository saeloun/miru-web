
/* eslint-disable @typescript-eslint/no-inferrable-types */

// Scope of AAD app. Use the below configuration to use all the permissions provided in the AAD app through Azure portal.
// Refer https://aka.ms/PowerBIPermissions for complete list of Power BI scopes
export const scopes: string[] = ["https://analysis.windows.net/powerbi/api/Report.Read.All"];

// Client Id (Application Id) of the AAD app.
export const clientId: string = "f707bbfa-8467-4358-a00e-9ad3f5c7d3f2";

// Id of the workspace where the report is hosted
export const workspaceId: string = "E063FE45-307B-45E9-BBC1-036D69C404DD";

// Id of the report to be embedded
export const reportId: string = "dc76e218-af79-4c57-b6af-6485f67b5fba";
