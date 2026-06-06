import { Sparkles } from "lucide-react";
import { AppShell } from "../AppShell.jsx";
import { invoices, pendingInvites, teamMembers, usageMetrics } from "../demoData.js";

export function TeamPage() {
  return (
    <AppShell
      activePage="team"
      title="Team, Billing & Usage"
      subtitle="Manage your team, plan, billing, and usage across glasgate.ai."
      actions={
        <button type="button" className="primary-button"><Sparkles size={16} /> Upgrade Plan</button>
      }
    >
      <div className="audit-panels team-top-row">
        <article className="audit-panel">
          <div className="app-panel-head">
            <h2>Team Members</h2>
            <button type="button" className="text-link">Manage Team</button>
          </div>
          <p className="app-muted">6 of 12 seats used</p>
          <div className="app-table">
            <div className="app-table-head">
              <span>Name</span><span>Role</span><span>Status</span><span>Last active</span>
            </div>
            {teamMembers.map((m) => (
              <div className="app-table-row" key={m.email}>
                <strong>{m.name}</strong>
                <span>{m.role}</span>
                <span className="status-success">{m.status}</span>
                <span>{m.lastActive}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="audit-panel">
          <div className="app-panel-head">
            <h2>Invitations</h2>
            <button type="button" className="text-link">Invite Member</button>
          </div>
          <p className="app-muted">{pendingInvites.length} pending</p>
          {pendingInvites.map((inv) => (
            <div className="activity-row" key={inv.email}>
              <i />
              <span><strong>{inv.name}</strong> · {inv.role}</span>
              <small>Pending · {inv.sent}</small>
            </div>
          ))}
        </article>

        <article className="audit-panel plan-summary-card">
          <span className="app-chip app-chip-live">Active</span>
          <h2>Enterprise Plan</h2>
          <ul>
            <li>Up to 12 team members</li>
            <li>Unlimited audits & pipelines</li>
            <li>Priority support</li>
          </ul>
          <p className="app-muted">Renews May 19, 2026</p>
        </article>
      </div>

      <article className="audit-panel app-wide-panel">
        <div className="app-panel-head">
          <h2>Usage Overview</h2>
          <button type="button" className="outline-button">May 12 – May 19, 2026</button>
        </div>
        <div className="audit-metrics dash-metrics-5">
          {usageMetrics.map((m) => (
            <article className="metric-card dash-metric-card" key={m.label}>
              <strong>{m.value}</strong>
              <p>{m.label}</p>
              <small>/ {m.limit}</small>
              {m.percent != null && (
                <div className="usage-bar"><div style={{ width: `${m.percent}%` }} /></div>
              )}
            </article>
          ))}
        </div>
      </article>

      <div className="audit-panels">
        <article className="audit-panel">
          <h2>Billing Summary</h2>
          <div className="billing-rows">
            <div><span>Plan</span><strong>Enterprise Plan</strong></div>
            <div><span>Billing cycle</span><strong>Monthly</strong></div>
            <div><span>Next billing</span><strong>May 19, 2026</strong></div>
            <div><span>Payment</span><strong>Visa •••• 4242</strong></div>
          </div>
        </article>

        <article className="audit-panel">
          <h2>Recent Invoices</h2>
          {invoices.map((inv) => (
            <div className="activity-row" key={inv.id}>
              <i />
              <span>{inv.id} · {inv.date}</span>
              <strong>{inv.amount}</strong>
              <small className="status-success">{inv.status}</small>
            </div>
          ))}
          <button type="button" className="text-link">View all invoices</button>
        </article>

        <article className="audit-panel upgrade-cta-card">
          <h2>Upgrade Your Plan</h2>
          <p>Get more seats, advanced data retention, and custom SLAs.</p>
          <button type="button" className="primary-button">Upgrade Plan</button>
        </article>
      </div>

      <p className="app-muted security-foot">Your data is secure and encrypted. Learn more about our security practices.</p>
    </AppShell>
  );
}
