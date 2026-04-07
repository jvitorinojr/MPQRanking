export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateFull(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getNextThursday(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilThursday = (4 - day + 7) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilThursday);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

export function getPositionLabel(position: string): string {
  const map: Record<string, string> = {
    goalkeeper: 'Goleiro',
    defender: 'Zagueiro',
    defensive_mid: 'Volante',
    fullback: 'Lateral',
    midfielder: 'Meia',
    forward: 'Atacante',
  };
  return map[position] || position;
}

export function getPositionColor(position: string): string {
  const map: Record<string, string> = {
    goalkeeper: '#f1c40f',
    defender: '#3498db',
    defensive_mid: '#9b59b6',
    fullback: '#1abc9c',
    midfielder: '#e67e22',
    forward: '#e74c3c',
  };
  return map[position] || '#95a5a6';
}

export const POSITIONS = [
  { value: 'goalkeeper', label: 'Goleiro' },
  { value: 'defender', label: 'Zagueiro' },
  { value: 'defensive_mid', label: 'Volante' },
  { value: 'fullback', label: 'Lateral' },
  { value: 'midfielder', label: 'Meia' },
  { value: 'forward', label: 'Atacante' },
];

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export function getYearRange(year: number): { start: string; end: string } {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}
