export const hasEmployeeRecordsAccess = (
  company,
  user,
  role,
  target = user?.id
) =>
  company?.employee_records_available === true &&
  company?.id != null &&
  String(company.id) === String(user?.current_workspace_id) &&
  ["owner", "admin", "manager", "employee", "book_keeper"].includes(role) &&
  (["owner", "admin"].includes(role) || String(target) === String(user?.id));
