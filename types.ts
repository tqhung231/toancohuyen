export interface Student {
  id: string;
  number: number;
  name: string;
  bonus: number;
  minus: number;
}

export interface ClassGroup {
  id: string;
  name: string;
  students: Student[];
}

export interface AIInsightState {
  loading: boolean;
  content: string | null;
  error: string | null;
}