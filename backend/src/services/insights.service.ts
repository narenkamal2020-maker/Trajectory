import oracledb from 'oracledb';
import { v4 as uuidv4 } from 'uuid';
import { query, execute, withTransaction } from '../config/oracle';
import { notFound } from '../lib/http';
import { num, parseJson } from '../lib/util';

const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : null);

export interface TelemetryEvent {
  name: string;
  path?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
  referrer?: string;
  props?: Record<string, string | number | boolean>;
}

export const InsightsService = {
  // ── Contact ──
  async createMessage(m: { name: string; email: string; topic: string; message: string; userId?: string | null }) {
    const id = uuidv4();
    await execute(
      `INSERT INTO CONTACT_MESSAGES (MESSAGE_ID, USER_ID, NAME, EMAIL, TOPIC, MESSAGE) VALUES (:id, :userId, :name, :email, :topic, :message)`,
      { id, userId: m.userId ?? null, name: m.name, email: m.email, topic: m.topic, message: { val: m.message, type: oracledb.CLOB } }
    );
    return { id };
  },

  async messages() {
    const r = await query<any>(`SELECT * FROM CONTACT_MESSAGES ORDER BY CASE STATUS WHEN 'NEW' THEN 0 WHEN 'READ' THEN 1 ELSE 2 END, CREATED_AT DESC FETCH FIRST 200 ROWS ONLY`);
    return (r.rows ?? []).map((m) => ({
      id: m.MESSAGE_ID, userId: m.USER_ID, name: m.NAME, email: m.EMAIL, topic: m.TOPIC, message: m.MESSAGE, status: m.STATUS, createdAt: iso(m.CREATED_AT),
    }));
  },

  async setMessageStatus(id: string, status: 'NEW' | 'READ' | 'CLOSED') {
    const r = await withTransaction((c) => c.execute(`UPDATE CONTACT_MESSAGES SET STATUS = :status WHERE MESSAGE_ID = :id`, { status, id }));
    if (!r.rowsAffected) throw notFound('Message');
  },

  // ── Analytics (first-party, consent-gated, no IP/user-agent) ──
  async recordEvents(sessionId: string, userId: string | null, events: TelemetryEvent[]) {
    await withTransaction(async (conn) => {
      for (const e of events) {
        await conn.execute(
          `INSERT INTO ANALYTICS_EVENTS (EVENT_ID, SESSION_ID, USER_ID, EVENT_NAME, PATH, UTM_SOURCE, UTM_MEDIUM, UTM_CAMPAIGN, REFERRER, PROPS)
           VALUES (:id, :sid, :userId, :name, :path, :src, :med, :camp, :ref, :props)`,
          {
            id: uuidv4(), sid: sessionId, userId, name: e.name, path: e.path ?? null,
            src: e.utm?.source ?? null, med: e.utm?.medium ?? null, camp: e.utm?.campaign ?? null,
            ref: e.referrer ?? null, props: e.props ? JSON.stringify(e.props).slice(0, 1000) : null,
          }
        );
      }
    });
  },

  async siteAnalytics(days: number) {
    const since = { d: days };
    const [totals, pages, events, sources, signups, daily] = await Promise.all([
      query<any>(`SELECT COUNT(*) AS EVENTS, COUNT(DISTINCT SESSION_ID) AS SESSIONS,
                    COUNT(CASE WHEN EVENT_NAME = 'page_view' THEN 1 END) AS VIEWS
                  FROM ANALYTICS_EVENTS WHERE CREATED_AT > SYSTIMESTAMP - NUMTODSINTERVAL(:d, 'DAY')`, since),
      query<any>(`SELECT PATH, COUNT(*) AS N FROM ANALYTICS_EVENTS WHERE EVENT_NAME = 'page_view' AND CREATED_AT > SYSTIMESTAMP - NUMTODSINTERVAL(:d, 'DAY')
                  GROUP BY PATH ORDER BY N DESC FETCH FIRST 15 ROWS ONLY`, since),
      query<any>(`SELECT EVENT_NAME, COUNT(*) AS N FROM ANALYTICS_EVENTS WHERE EVENT_NAME <> 'page_view' AND CREATED_AT > SYSTIMESTAMP - NUMTODSINTERVAL(:d, 'DAY')
                  GROUP BY EVENT_NAME ORDER BY N DESC FETCH FIRST 15 ROWS ONLY`, since),
      query<any>(`SELECT NVL(UTM_SOURCE, '(direct)') AS SRC, NVL(UTM_MEDIUM, '-') AS MED, NVL(UTM_CAMPAIGN, '-') AS CAMP, COUNT(DISTINCT SESSION_ID) AS SESSIONS
                  FROM ANALYTICS_EVENTS WHERE CREATED_AT > SYSTIMESTAMP - NUMTODSINTERVAL(:d, 'DAY')
                  GROUP BY NVL(UTM_SOURCE, '(direct)'), NVL(UTM_MEDIUM, '-'), NVL(UTM_CAMPAIGN, '-') ORDER BY SESSIONS DESC FETCH FIRST 15 ROWS ONLY`, since),
      query<any>(`SELECT SIGNUP_SOURCE FROM TRAJECTORY_USERS WHERE CREATED_AT > SYSTIMESTAMP - NUMTODSINTERVAL(:d, 'DAY')`, since),
      query<any>(`SELECT TO_CHAR(CREATED_AT, 'YYYY-MM-DD') AS DAY, COUNT(CASE WHEN EVENT_NAME = 'page_view' THEN 1 END) AS VIEWS, COUNT(DISTINCT SESSION_ID) AS SESSIONS
                  FROM ANALYTICS_EVENTS WHERE CREATED_AT > SYSTIMESTAMP - NUMTODSINTERVAL(:d, 'DAY') GROUP BY TO_CHAR(CREATED_AT, 'YYYY-MM-DD') ORDER BY DAY`, since),
    ]);
    const bySource = new Map<string, number>();
    for (const r of signups.rows ?? []) {
      const src = parseJson<{ source?: string }>(r.SIGNUP_SOURCE, {}).source ?? '(direct)';
      bySource.set(src, (bySource.get(src) ?? 0) + 1);
    }
    const t = totals.rows?.[0] ?? {};
    return {
      days,
      totals: { events: num(t.EVENTS), sessions: num(t.SESSIONS), pageViews: num(t.VIEWS), signups: signups.rows?.length ?? 0 },
      topPages: (pages.rows ?? []).map((r) => ({ path: r.PATH ?? '/', views: num(r.N) })),
      topEvents: (events.rows ?? []).map((r) => ({ name: r.EVENT_NAME, count: num(r.N) })),
      sources: (sources.rows ?? []).map((r) => ({ source: r.SRC, medium: r.MED, campaign: r.CAMP, sessions: num(r.SESSIONS) })),
      signupsBySource: [...bySource.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      daily: (daily.rows ?? []).map((r) => ({ date: r.DAY, views: num(r.VIEWS), sessions: num(r.SESSIONS) })),
    };
  },

  // ── Audit ──
  async auditLog(f: { severity?: string; action?: string; limit: number }) {
    const where = ['1 = 1'];
    const binds: Record<string, any> = { lim: f.limit };
    if (f.severity) { where.push('a.SEVERITY = :sev'); binds.sev = f.severity; }
    if (f.action) { where.push('a.ACTION LIKE :act'); binds.act = `${f.action}%`; }
    const [rows, counts] = await Promise.all([
      query<any>(`SELECT a.*, u.EMAIL AS ACTOR_EMAIL FROM AUDIT_LOG a LEFT JOIN TRAJECTORY_USERS u ON u.USER_ID = a.ACTOR_ID
                  WHERE ${where.join(' AND ')} ORDER BY a.CREATED_AT DESC FETCH FIRST :lim ROWS ONLY`, binds),
      query<any>(`SELECT SEVERITY, COUNT(*) AS N FROM AUDIT_LOG WHERE CREATED_AT > SYSTIMESTAMP - INTERVAL '1' DAY GROUP BY SEVERITY`),
    ]);
    const last24h = Object.fromEntries((counts.rows ?? []).map((r) => [r.SEVERITY, num(r.N)]));
    return {
      last24h: { INFO: last24h.INFO ?? 0, WARN: last24h.WARN ?? 0, ALERT: last24h.ALERT ?? 0 },
      items: (rows.rows ?? []).map((a) => ({
        id: a.AUDIT_ID, action: a.ACTION, severity: a.SEVERITY, actorId: a.ACTOR_ID, actorEmail: a.ACTOR_EMAIL ?? null,
        targetType: a.TARGET_TYPE, targetId: a.TARGET_ID, ip: a.IP_ADDRESS, details: parseJson(a.DETAILS, null), createdAt: iso(a.CREATED_AT),
      })),
    };
  },
};
