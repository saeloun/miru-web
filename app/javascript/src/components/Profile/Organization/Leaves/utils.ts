import {
  holidayColors,
  holidayIcons,
  leaveColors,
  leaveIcons,
} from "constants/leaveType";

export const generateLeaveColor = name =>
  leaveColors.find(colorObj => colorObj.label === name);

export const generateLeaveIcon = name =>
  leaveIcons.find(iconObj => iconObj.value === name);

export const generateHolidayColor = name =>
  holidayColors.find(colorObj => colorObj.label === name);

export const generateHolidayIcon = name =>
  holidayIcons.find(iconObj => iconObj.label === name);

export const generatePayload = leaves =>
  leaves.map(leave => ({
    name: leave.leaveType,
    icon: leave.leaveIcon.value,
    color: leave.leaveColor.label,
    allocation_value: leave.total,
    allocation_period: leave.allocationPeriod,
    allocation_frequency: leave.allocationFrequency,
    carry_forward_days: leave.carryForwardDays,
  }));

export const makeLeavePayload = leave => ({
  id: leave.id,
  name: leave.leaveType,
  icon: leave.leaveIcon.value,
  color: leave.leaveColor.label,
  allocation_value: leave.total,
  allocation_period: leave.allocationPeriod,
  allocation_frequency: leave.allocationFrequency,
  carry_forward_days: leave.carryForwardDays,
});

export const makeCustomLeavePayload = leave => ({
  id: leave.id,
  name: leave.customLeaveType,
  allocation_value: leave.customLeaveTotal,
  allocation_period: leave.customAllocationPeriod,
  user_ids: leave.employees.map(emp => emp.value),
});

export const makeLeavesList = leaveTypes =>
  leaveTypes.map(leaveType => ({
    id: leaveType.id,
    leaveType: leaveType.name,
    leaveIcon: generateLeaveIcon(leaveType.icon),
    leaveColor: generateLeaveColor(leaveType.color),
    total: leaveType.allocation_value,
    allocationPeriod: leaveType.allocation_period,
    allocationFrequency: leaveType.allocation_frequency,
    carryForwardDays: leaveType.carry_forward_days,
  }));

export const makeCustomLeavesList = customLeaves =>
  customLeaves.map(leave => ({
    id: leave.id,
    customLeaveType: leave.name,
    customLeaveTotal: leave.allocation_value,
    customAllocationPeriod: leave.allocation_period,
    employees: leave.users.map(emp => ({
      value: emp.id,
      label: emp.full_name,
    })),
  }));
