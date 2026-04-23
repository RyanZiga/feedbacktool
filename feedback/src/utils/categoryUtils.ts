export const CATEGORIES = [
  'Bug Report',
  'Feature Request',
  'Question',
  'Complaint',
  'Suggestion',
] as const;

export type Category = typeof CATEGORIES[number];

export const getCategoryColor = (category: string): 'error' | 'primary' | 'info' | 'warning' | 'secondary' => {
  switch (category) {
    case 'Bug Report':
      return 'error';
    case 'Feature Request':
      return 'primary';
    case 'Question':
      return 'info';
    case 'Complaint':
      return 'warning';
    case 'Suggestion':
      return 'secondary';
    default:
      return 'secondary';
  }
};
