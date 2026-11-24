// What a report is really about. causes.ts places a report by tenant and channel; the desk's own
// notes (desk-notes.json) name the reports whose text describes something else: a one-day move.
// Those are a problem of their own, so they are taken out of the cause they were filed under.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day-move' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  return oneDayMove.includes(r.id) ? 'one-day-move' : (causeOf(r, t) ?? 'unplaced');
}
