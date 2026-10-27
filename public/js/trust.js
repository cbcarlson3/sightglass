// Trust labels. Every result on screen carries one of these (see SPEC.md, "Trust labels").

export const TRUST = {
  read: { icon: '✅', text: 'Read from plate', tone: 'good' },
  decoded: { icon: '✅', text: 'Decoded', tone: 'good' },
  ai: { icon: '⚠️', text: 'AI suggestion, verify with the manual', tone: 'warn' },
  unreadable: { icon: '❔', text: 'Unreadable', tone: 'muted' },
  unknown: { icon: '❔', text: 'Unknown', tone: 'muted' },
};
