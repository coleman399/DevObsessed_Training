import { StatsList } from './StatsList';

interface TodayPanelProps {
  onSessionExpired?: () => void;
}

export function TodayPanel({ onSessionExpired }: TodayPanelProps) {
  return <StatsList onSessionExpired={onSessionExpired} />;
}
