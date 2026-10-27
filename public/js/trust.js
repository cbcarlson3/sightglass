// Trust labels. Every result on screen carries one of these (see SPEC.md, "Trust labels").
// `icon` names a drawing in results.js (check, alert or question).

export const TRUST = {
  read: { icon: 'check', text: 'Read from tag', tone: 'good' },
  decoded: { icon: 'check', text: 'Decoded', tone: 'good' },
  ai: { icon: 'alert', text: 'AI suggestion, verify with the manual', tone: 'warn' },
  unreadable: { icon: 'question', text: 'Unreadable', tone: 'muted' },
  unknown: { icon: 'question', text: 'Unknown', tone: 'muted' },
};
