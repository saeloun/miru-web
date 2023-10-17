import { leaveColors, leaveIcons } from "constants/leaveType";

const generateLeaveColor = name =>
  leaveColors.find(colorObj => colorObj.label === name);

const generateLeaveIcon = name =>
  leaveIcons.find(iconObj => iconObj.value === name);

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
