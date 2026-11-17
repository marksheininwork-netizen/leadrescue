export function leadState(lead,today=new Date().toISOString().slice(0,10)){
  if(['Won','Closed'].includes(lead.status))return 'closed';
  return lead.followup<today?'overdue':lead.followup===today?'today':'upcoming';
}
export function followUpDraft(lead){return `Hi ${lead.name}, just checking in about ${lead.need}. Is this still something you'd like help with? I’m happy to answer questions or talk through the next step.`}
export function countOpen(leads){return leads.filter(lead=>leadState(lead)!=='closed').length}
