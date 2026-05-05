/**
 * MetricCard component for displaying stats
 */
export default function MetricCard({ icon: Icon, label, value, highlight = false }) {
  return (
    <article className={`metric-card ${highlight ? 'highlight' : ''}`}>
      <Icon size={21} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
