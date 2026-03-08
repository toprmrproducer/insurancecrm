import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  delta,
  tone = "default",
}: {
  label: string;
  value: string | number;
  delta: string;
  tone?: "default" | "highlight";
}) {
  return (
    <article className={`card stat-card ${tone === "highlight" ? "stat-card-highlight" : ""}`}>
      <p className="muted">{label}</p>
      <strong className="stat-value">{value}</strong>
      <span className="stat-delta">{delta}</span>
    </article>
  );
}

export function SectionCard({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          {meta ? <p className="muted">{meta}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
