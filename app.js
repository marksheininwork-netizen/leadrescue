import { countOpen, dueLabel, followUpDraft, leadState, localISODate, shiftISODate } from './core.mjs';

const storageKey = 'leadrescue.leads.v1';
const statuses = ['New', 'Contacted', 'Qualified', 'Won', 'Closed'];
const sampleLeads = () => [
  { id: crypto.randomUUID(), name: 'Jordan Miles', email: '', need: 'Kitchen remodel', value: 12000, source: 'Website', followup: localISODate(), status: 'New', notes: 'Asked about a spring start.' },
  { id: crypto.randomUUID(), name: 'Sam Patel', email: '', need: 'Office painting', value: 4200, source: 'Referral', followup: shiftISODate(localISODate(), 3), status: 'Contacted', notes: 'Send color samples.' },
];

function readLeads() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return Array.isArray(saved) ? saved : sampleLeads();
  } catch {
    return sampleLeads();
  }
}

let leads = readLeads();
// Persist first-run sample records so the dashboard and analytics pages share the same data.
if (!localStorage.getItem(storageKey)) localStorage.setItem(storageKey, JSON.stringify(leads));
window.dispatchEvent(new Event('app-data-updated'));
let filter = 'all';
const $ = selector => document.querySelector(selector);
const form = $('#lead-form');
const money = value => { let currency = 'USD'; try { currency = JSON.parse(localStorage.getItem('leadrescue.preferences.v1') || '{}').currency || 'USD'; } catch {} return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value) || 0); };

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2200);
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(leads));
  window.dispatchEvent(new Event('app-data-updated'));
  render();
}


function setupDataBackup(appName, readRecords, replaceRecords, isValidRecord) {
  $('#backup-export').onclick = () => {
    const payload = { app: appName, version: 1, exportedAt: new Date().toISOString(), records: readRecords() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${appName}-backup-${localISODate()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Backup downloaded');
  };
  $('#backup-import').onclick = () => $('#backup-file').click();
  $('#backup-file').onchange = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (backup.app !== appName || backup.version !== 1 || !Array.isArray(backup.records) || !backup.records.every(isValidRecord)) {
        throw new Error('This file is not a valid backup for this app.');
      }
      if (!confirm(`Replace this device’s current data with ${backup.records.length} records from this backup? This cannot be undone.`)) return;
      replaceRecords(backup.records);
      persist();
      toast(`Imported ${backup.records.length} records`);
    } catch (error) {
      toast(error instanceof SyntaxError ? 'Could not read that backup file' : error.message || 'Could not import backup');
    } finally {
      event.target.value = '';
    }
  };
}
setupDataBackup('leadrescue', () => leads, records => { leads = records; }, lead => lead && typeof lead.name === 'string' && typeof lead.need === 'string' && typeof lead.followup === 'string');

function editLead(lead) {
  for (const field of ['id', 'name', 'email', 'need', 'value', 'source', 'followup', 'status', 'notes']) {
    form.elements.namedItem(field).value = lead[field] || '';
  }
  form.querySelector('[type="submit"]').textContent = 'Save changes';
  form.classList.remove('hidden');
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  form.elements.namedItem('name').focus();
}

function render() {
  const today = localISODate();
  const open = leads.filter(lead => leadState(lead, today) !== 'closed');
  const pipelineValue = open.reduce((sum, lead) => sum + Math.max(0, Number(lead.value) || 0), 0);
  $('#stats').innerHTML = `
    <div class="stat"><label>Open leads</label><strong>${countOpen(leads)}</strong></div>
    <div class="stat"><label>Follow up today</label><strong>${open.filter(lead => leadState(lead, today) === 'today').length}</strong></div>
    <div class="stat"><label>Past due</label><strong>${open.filter(lead => leadState(lead, today) === 'overdue').length}</strong></div>
    <div class="stat"><label>Open pipeline value</label><strong>${money(pipelineValue)}</strong></div>`;

  const query = $('#lead-search').value.trim().toLowerCase();
  const visible = leads.filter(lead => {
    const state = leadState(lead, today);
    const matchesFilter = filter === 'all' || state === filter || lead.status === filter;
    const matchesQuery = `${lead.name} ${lead.need} ${lead.source || ''} ${lead.email || ''}`.toLowerCase().includes(query);
    return matchesFilter && matchesQuery;
  }).sort((a, b) => {
    const aClosed = leadState(a, today) === 'closed';
    const bClosed = leadState(b, today) === 'closed';
    if (aClosed !== bClosed) return Number(aClosed) - Number(bClosed);
    return a.followup.localeCompare(b.followup);
  });

  const body = $('#leads');
  body.replaceChildren();
  for (const lead of visible) {
    const state = leadState(lead, today);
    const row = document.createElement('tr');
    row.innerHTML = `<td><div class="client-name"></div><div class="invoice-number"></div><small class="last-contact"></small></td><td class="need-cell"></td><td class="value-cell"></td><td><time></time><small class="due-note"></small></td><td><span class="pill"></span></td><td><div class="row-actions"></div></td>`;
    row.querySelector('.client-name').textContent = lead.name;
    row.querySelector('.invoice-number').textContent = lead.source || 'Direct inquiry';
    row.querySelector('.last-contact').textContent = lead.lastContacted ? `Last contact: ${lead.lastContacted} · ${lead.contactCount || 1} logged` : 'No contact logged';
    row.querySelector('.need-cell').textContent = lead.need;
    row.querySelector('.value-cell').textContent = money(lead.value);
    row.querySelector('time').dateTime = lead.followup;
    row.querySelector('time').textContent = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${lead.followup}T12:00:00`));
    row.querySelector('.due-note').textContent = state === 'closed' ? 'Closed' : dueLabel(lead.followup, today);
    const badge = row.querySelector('.pill');
    badge.className = `pill ${state === 'closed' ? 'paid' : state === 'upcoming' ? 'upcoming' : 'due'}`;
    badge.textContent = lead.status;

    const actions = row.querySelector('.row-actions');
    const draft = document.createElement('button');
    draft.type = 'button';
    draft.textContent = lead.email ? 'Draft email' : 'Copy draft';
    draft.setAttribute('aria-label', `${lead.email ? 'Open email draft for' : 'Copy follow-up draft for'} ${lead.name}`);
    draft.onclick = async () => {
      const message = followUpDraft(lead);
      if (lead.email) {
        const subject = `Following up: ${lead.need}`;
        window.location.href = `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        toast('Email draft opened. Review it before sending.');
        return;
      }
      try {
        await navigator.clipboard.writeText(message);
        toast('Draft copied. Review and send it yourself.');
      } catch {
        prompt('Copy this follow-up draft:', message);
      }
    };
    actions.append(draft);
    const snooze = (days, label) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.setAttribute('aria-label', `Move ${lead.name} follow-up ${days} days later`);
      button.onclick = () => { lead.followup = shiftISODate(localISODate(), days); persist(); toast(`Follow-up moved ${days === 1 ? 'to tomorrow' : 'one week later'}`); };
      actions.append(button);
    };
    snooze(1, '+1 day');
    snooze(7, '+7 days');
    const logContact = document.createElement('button');
    logContact.type = 'button';
    logContact.textContent = 'Log contact';
    logContact.setAttribute('aria-label', `Log a contact with ${lead.name}`);
    logContact.onclick = () => {
      lead.lastContacted = localISODate();
      lead.contactCount = Number(lead.contactCount || 0) + 1;
      if (lead.status === 'New') lead.status = 'Contacted';
      persist();
      toast('Contact logged on this device');
    };
    actions.append(logContact);
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Edit';
    edit.onclick = () => editLead(lead);
    actions.append(edit);

    const status = document.createElement('select');
    status.setAttribute('aria-label', `Status for ${lead.name}`);
    for (const value of statuses) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      option.selected = lead.status === value;
      status.append(option);
    }
    status.onchange = () => { lead.status = status.value; persist(); };
    actions.append(status);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.setAttribute('aria-label', `Delete lead ${lead.name}`);
    remove.onclick = () => {
      if (!confirm(`Delete ${lead.name} from this browser?`)) return;
      leads = leads.filter(item => item.id !== lead.id);
      persist();
      toast('Lead deleted');
    };
    actions.append(remove);
    body.append(row);
  }

  const noMatches = visible.length === 0;
  $('#empty').classList.toggle('hidden', !noMatches);
  $('#empty').textContent = leads.length === 0
    ? 'No leads yet. Add one when someone reaches out.'
    : 'No leads match this search or filter. Try another.';
  $('.table-wrap').classList.toggle('hidden', noMatches);
}

$('#add-toggle').onclick = () => {
  form.reset();
  form.elements.namedItem('id').value = '';
  try { const prefs = JSON.parse(localStorage.getItem('leadrescue.preferences.v1') || '{}'); form.elements.namedItem('followup').value = shiftISODate(localISODate(), Number(prefs.followupDays) || 3); } catch {}
  form.querySelector('[type="submit"]').textContent = 'Save lead';
  form.classList.remove('hidden');
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  form.elements.namedItem('name').focus();
};
$('#cancel').onclick = () => { form.reset(); form.classList.add('hidden'); };
$('#lead-search').addEventListener('input', render);
$('#lead-filter').addEventListener('change', event => { filter = event.target.value; render(); });

form.onsubmit = event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  values.name = values.name.trim();
  values.need = values.need.trim();
  const existing = leads.find(lead => lead.id === values.id);
  const lead = { ...existing, ...values, value: Math.max(0, Number(values.value) || 0), id: existing?.id || crypto.randomUUID() };
  if (existing) leads = leads.map(item => item.id === existing.id ? lead : item);
  else leads.unshift(lead);
  form.reset();
  form.classList.add('hidden');
  persist();
  toast(existing ? 'Lead updated on this device' : 'Lead saved on this device');
};

$('#export').onclick = () => {
  const rows = [['Name', 'Email', 'Project', 'Estimated value', 'Source', 'Follow up', 'Status', 'Notes'], ...leads.map(lead => [lead.name, lead.email, lead.need, lead.value || 0, lead.source, lead.followup, lead.status, lead.notes])];
  const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leads.csv';
  link.click();
  URL.revokeObjectURL(url);
};

render();

import './feature-pages.js';
