function isSameUserId(uId: string, lAssignedTo: string): boolean {
  if (!uId || !lAssignedTo) return false;
  if (lAssignedTo === uId || lAssignedTo.toLowerCase() === uId.toLowerCase()) return true;
  const numUId = Number.parseInt(uId.replace(/\D/g, ''), 10);
  const numLId = Number.parseInt(lAssignedTo.replace(/\D/g, ''), 10);
  return !Number.isNaN(numUId) && !Number.isNaN(numLId) && numUId === numLId;
}

function isSameUserEmail(uEmail: string, lAssignedTo: string, lAssigneeEmail: string, lAssigneeName: string): boolean {
  if (!uEmail) return false;
  const target = uEmail.toLowerCase();
  return (
    lAssignedTo.toLowerCase() === target ||
    lAssigneeEmail.toLowerCase() === target ||
    lAssigneeName.toLowerCase() === target
  );
}

function isSameUserName(uName: string, lAssigneeName: string, lAssignedTo: string): boolean {
  if (!uName) return false;
  const target = uName.toLowerCase();
  const aName = lAssigneeName.toLowerCase();
  const aTo = lAssignedTo.toLowerCase();
  if (aName === target || aTo === target) return true;
  if (aName && (aName.includes(target) || target.includes(aName))) return true;
  return Boolean(aTo && (aTo.includes(target) || target.includes(aTo)));
}

function hasMatchingToken(uTokens: string[], lTokens: string[]): boolean {
  for (const ut of uTokens) {
    for (const lt of lTokens) {
      if (ut === lt || ut.includes(lt) || lt.includes(ut)) return true;
    }
  }
  return false;
}

export function isLeadAssignedToUser(l: any, user: any): boolean {
  if (!l || !user) return false;
  const uId = String(user.id || '').trim();
  const uEmail = String(user.email || '').toLowerCase().trim();
  const uName = String(user.fullName || user.name || user.username || '').toLowerCase().trim();

  const lAssignedTo = String(l.assignedTo || l.assigned_to || l.assignedTelecallerId || l.assigned_telecaller_id || '').trim();
  const lAssigneeName = String(l.assigneeName || l.assignee_name || l.assigneeFullName || l.assignedToName || '').toLowerCase().trim();
  const lAssigneeEmail = String(l.assigneeEmail || l.assignee_email || '').toLowerCase().trim();

  if (isSameUserId(uId, lAssignedTo)) return true;
  if (isSameUserEmail(uEmail, lAssignedTo, lAssigneeEmail, lAssigneeName)) return true;
  if (isSameUserName(uName, lAssigneeName, lAssignedTo)) return true;

  const uTokens = [uName, uEmail.split('@')[0], uId].filter((t) => t && t.length >= 3);
  const lTokens = [lAssigneeName, lAssignedTo.toLowerCase(), lAssigneeEmail.split('@')[0]].filter((t) => t && t.length >= 3);
  return hasMatchingToken(uTokens, lTokens);
}