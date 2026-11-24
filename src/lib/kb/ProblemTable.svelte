<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, readAs, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // Counts the way the desk's own view does (CauseTable): a report is counted under its cause, and
  // the reports the desk read as a one-day move are counted where they are filed and shown again
  // on a row of their own. `tickets`: problem → link to the ticket that now holds it.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Record<string, string> } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByCause(merged, tenantOf));
  const rows = $derived([
    ...groups.map((g) => ({
      problem: g.cause as string,
      count: g.reports.length,
      mistagged: `${g.reports.filter((r) => r.meta.intakeTag !== g.cause).length}`,
      tenants: g.tenants,
      first: g.firstSeen,
      last: g.lastSeen,
      inside: null as string | null,
    })),
    ...groups.flatMap((g) => {
      const rs = g.reports.filter((r) => notes.oneDayMove.includes(r.id));
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return readAs(g, notes.oneDayMove)
        ? [{ problem: 'one-day-move', count: rs.length, mistagged: 'no such tag', tenants: new Set(rs.map((r) => r.tenant)).size, first: days[0], last: days[days.length - 1], inside: g.cause as string }]
        : [];
    }),
  ]);
  const subjects = $derived(new Set(merged.map((r) => r.subject)).size);
  const exportRows = (reports as Report[]).length;
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports in #{ticket} ·
  <strong>{rows.length}</strong> {rows.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>intake tag differs</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each rows as r (r.problem)}
      <tr>
        <td><code>{r.problem}</code></td>
        <td>{r.count}{#if r.inside}&nbsp;<span class="note">(counted in <code>{r.inside}</code>)</span>{/if}</td>
        <td>{r.mistagged}</td>
        <td>{r.tenants}</td>
        <td>{r.first} → {r.last}</td>
        <td>{#if tickets[r.problem]}<a href={tickets[r.problem]}>#{tickets[r.problem].split('/').pop()}</a>{:else}none yet{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">
  Counted as the desk's own view counts: a one-day move stays in the count of the cause it is filed under.
  The export has {exportRows} rows for {merged.length} reports: its pages overlap, and a report is counted once, by id.
  The {merged.length} reports carry {subjects} different subject lines.
</p>

<style>
  .sum { font-size: 1.1rem; }
  .note { color: var(--muted); font-size: 0.85em; }
</style>
