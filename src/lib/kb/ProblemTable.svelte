<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { CAUSES, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { problemOf, type Problem } from '#lib/kb/problems';

  // `tickets`: problem → link to the ticket that now holds it.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const rows = $derived.by(() => {
    const by = new Map<Problem, Report[]>();
    for (const r of merged) {
      const p = problemOf(r, tenantOf(r), notes.oneDayMove);
      by.set(p, [...(by.get(p) ?? []), r]);
    }
    return [...by.entries()]
      .map(([problem, rs]) => {
        const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
        // Intake only ever tags parser or hint, so the count means nothing for any other problem.
        const mistagged = (CAUSES as readonly string[]).includes(problem) ? rs.filter((r) => r.meta.intakeTag !== problem).length : null;
        return { problem, count: rs.length, mistagged, tenants: new Set(rs.map((r) => r.tenant)).size, first: days[0], last: days[days.length - 1] };
      })
      .sort((a, b) => b.count - a.count);
  });
  const subjects = $derived(new Set(merged.map((r) => r.subject)).size);
  const exportRows = (reports as Report[]).length;
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports in #{ticket} ·
  <strong>{rows.length}</strong> {rows.length === 1 ? 'problem' : 'problems'} ·
  {rows.map((r) => r.count).join(' + ')} = {rows.reduce((n, r) => n + r.count, 0)}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>intake tag differs</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each rows as r (r.problem)}
      <tr>
        <td><code>{r.problem}</code></td>
        <td>{r.count}</td>
        <td>{r.mistagged ?? 'no such tag'}</td>
        <td>{r.tenants}</td>
        <td>{r.first} → {r.last}</td>
        <td>{#if tickets[r.problem]}<a href={tickets[r.problem]}>#{tickets[r.problem]?.split('/').pop()}</a>{:else}none yet{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">
  The export has {exportRows} rows for {merged.length} reports: its pages overlap, and a report is counted once, by id.
  The {merged.length} reports carry {subjects} different subject lines.
</p>

<style>
  .sum { font-size: 1.1rem; }
  .note { color: var(--muted); font-size: 0.85em; }
</style>
