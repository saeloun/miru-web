---
id: leave-management
title: Leave Management
sidebar_position: 3
---

# Leave Management

Miru provides comprehensive leave management capabilities that allow organizations to define leave policies and track employee time off. This guide covers both standard leave types and custom leaves.

## Overview

Leave management in Miru consists of two types of leaves:

1. **Standard Leave Types** - Company-wide leave policies that apply to all employees (e.g., PTO, Sick Leave, Maternity Leave)
2. **Custom Leaves** - Special leave allocations assigned to specific employees

## Accessing Leave Settings

Admins can configure leave settings by navigating to:

**Settings > Leaves**

Here you can:
- View and manage leave types for each year
- Add new leave types
- Create custom leaves for specific employees
- Modify allocation values and periods

## Standard Leave Types

### Creating a Leave Type

1. Go to **Settings > Leaves**
2. Select the year you want to configure
3. Click **Add Leave Type**
4. Configure the following:
   - **Name**: The leave type name (e.g., "Annual Leave", "Sick Leave")
   - **Icon**: Visual identifier for the leave type
   - **Color**: Color coding for easy identification
   - **Allocation Value**: Number of days/weeks/months allocated
   - **Allocation Period**: Unit of allocation (days, weeks, or months)
   - **Allocation Frequency**: How often the leave is allocated (per week, per month, per quarter, per year)
   - **Carry Forward Days**: Number of unused days that can be carried to the next year

### How Standard Leave Types Work

- Apply to **all employees** in the company
- Allocation is calculated based on the employee's join date
- Balance is prorated for employees who join mid-year
- Unused days can be carried forward based on the configured limit

## Custom Leaves

Custom leaves are special allocations for specific employees. Use these for:
- One-time special leave grants
- Employee-specific accommodations
- Bonus leave allocations
- Compensatory time off

### Creating a Custom Leave

1. Go to **Settings > Leaves**
2. Select the year
3. Scroll to the **Custom Leaves** section
4. Click **Add Custom Leave**
5. Configure:
   - **Name**: Descriptive name for the custom leave
   - **Allocation Value**: Number of days/weeks/months
   - **Allocation Period**: Unit (days, weeks, or months)
   - **Employees**: Select specific employees who should receive this leave

### How Custom Leaves Work

- Assigned to **specific employees** only
- Appear in the employee's leave balance alongside standard leave types
- Can be used when logging time off
- Balance is tracked separately from standard leave types

## Using Leave (Time Off)

### For Employees

Employees can log time off from the **Time Tracking** page:

1. Go to **Time Tracking**
2. Click to add a new entry
3. Select the leave type from the dropdown (includes both standard and custom leaves assigned to you)
4. Enter the duration and date
5. Add optional notes
6. Save the entry

### Viewing Leave Balance

Employees can view their leave balance on the **Leave Management** page:

- Navigate to **Leave Management** from the sidebar
- View available balance for each leave type
- See utilized vs. remaining leave
- Custom leaves appear with a distinct color (purple by default)

### Filtering Time Off Entries

On the Leave Management page, you can filter time off entries by leave type:

1. Navigate to **Leave Management**
2. Click on any leave type card (PTO, Sick Leave, Custom Leave, etc.)
3. The table below will filter to show only time off entries for that leave type
4. The duration summary updates to show total time used for the selected leave type
5. Click on a different leave type to change the filter, or view all entries by default

This filtering works for:
- Standard leave types (PTO, Sick Leave, etc.)
- Custom leaves assigned to the employee
- National and Optional holidays

## Impact Areas

Custom leaves integration affects the following areas of Miru:

### 1. Time Tracking
- Custom leaves appear in the leave type dropdown when logging time off
- Employees can only see custom leaves assigned to them
- Time off entries can be created, edited, and deleted for custom leaves

### 2. Leave Balance Display
- Custom leave balances appear alongside standard leave types
- Balance shows total allocation minus utilized time
- Displayed in the Leave Management dashboard

### 3. Settings > Leaves
- Admins can create, edit, and delete custom leaves
- Assign/unassign employees to custom leaves
- View which employees have which custom leaves

### 4. Employee Profile
- Custom leave allocations are visible in employee context
- Balance tracking per employee

## Best Practices

1. **Naming Convention**: Use clear, descriptive names for custom leaves (e.g., "2024 Bonus PTO - John", "Comp Time - Project X")

2. **Documentation**: Add notes when creating custom leaves to track the reason for the allocation

3. **Year-Specific**: Custom leaves are tied to a specific year - create new allocations each year as needed

4. **Regular Review**: Periodically review custom leave allocations to ensure they're still relevant

## Permissions

| Action | Owner | Admin | Employee |
|--------|-------|-------|----------|
| Create/Edit Leave Types | ✓ | ✓ | ✗ |
| Create/Edit Custom Leaves | ✓ | ✓ | ✗ |
| View Own Leave Balance | ✓ | ✓ | ✓ |
| Log Time Off | ✓ | ✓ | ✓ |
| View Team Leave Balance | ✓ | ✓ | ✗ |

## Troubleshooting

### Custom leave not appearing in dropdown
- Ensure the custom leave is assigned to the specific employee
- Verify the custom leave is for the current year
- Check that the leave has been saved successfully

### Balance not updating after logging time off
- Refresh the page to see updated balance
- Verify the time off entry was saved successfully
- Check that the correct leave type was selected

### Cannot edit a time off entry
- Only the employee who created the entry or an admin can edit it
- Ensure you have the correct permissions
