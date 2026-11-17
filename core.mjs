export function localISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftISODate(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localISODate(date);
}

export function leadState(lead, today = localISODate()) {
  if (['Won', 'Closed'].includes(lead.status)) return 'closed';
  if (lead.followup < today) return 'overdue';
  return lead.followup === today ? 'today' : 'upcoming';
}

export function dueLabel(followup, today = localISODate()) {
  const delta = Math.round((new Date(`${followup}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000);
  if (delta < 0) return `${Math.abs(delta)} day${delta === -1 ? '' : 's'} overdue`;
  if (delta === 0) return 'Follow up today';
  if (delta === 1) return 'Follow up tomorrow';
  return `Follow up in ${delta} days`;
}

export function followUpDraft(lead) {
  return `Hi ${lead.name}, just checking in about ${lead.need}. Is this still something you'd like help with? I’m happy to answer questions or talk through the next step.`;
}

export function countOpen(leads) {
  return leads.filter(lead => leadState(lead) !== 'closed').length;
}
