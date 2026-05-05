/**
 * StatsRow component - displays metrics for notifications received, unread, and read
 */
import { Bell, CheckCircle2, Megaphone } from 'lucide-react';
import MetricCard from './ui/MetricCard';

export default function StatsRow({ totalReceived, unreadCount, readCount }) {
  return (
    <section className="stats-row">
      <MetricCard icon={Bell} label="Received" value={totalReceived} />
      <MetricCard icon={Megaphone} label="Unread" value={unreadCount} highlight />
      <MetricCard icon={CheckCircle2} label="Read" value={readCount} />
    </section>
  );
}
