import { ClassGroup, Student } from '../types';
import { ensureSupabaseClient } from './supabaseClient';

type StudentMetric = 'bonus' | 'minus';

interface ClassRow {
  id: string;
  name: string;
}

interface StudentRow {
  id: string;
  class_id: string;
  number: number;
  name: string;
  bonus: number;
  minus: number;
}

const toClassGroups = (classRows: ClassRow[], studentRows: StudentRow[]): ClassGroup[] => {
  const studentsByClass = new Map<string, Student[]>();

  for (const row of studentRows) {
    const list = studentsByClass.get(row.class_id) ?? [];
    list.push({
      id: row.id,
      number: row.number,
      name: row.name,
      bonus: row.bonus,
      minus: row.minus
    });
    studentsByClass.set(row.class_id, list);
  }

  return classRows.map((cls) => ({
    id: cls.id,
    name: cls.name,
    students: (studentsByClass.get(cls.id) ?? []).sort((a, b) => (a.number || 0) - (b.number || 0))
  }));
};

export const fetchClassesFromSupabase = async (): Promise<ClassGroup[]> => {
  const supabase = ensureSupabaseClient();

  const [{ data: classes, error: classError }, { data: students, error: studentError }] = await Promise.all([
    supabase.from('classes').select('id, name'),
    supabase.from('students').select('id, class_id, number, name, bonus, minus').order('number', { ascending: true })
  ]);

  if (classError) {
    throw classError;
  }

  if (studentError) {
    throw studentError;
  }

  return toClassGroups((classes ?? []) as ClassRow[], (students ?? []) as StudentRow[]);
};

export const addClassToSupabase = async (classGroup: ClassGroup): Promise<void> => {
  const supabase = ensureSupabaseClient();
  const { error } = await supabase.from('classes').insert({
    id: classGroup.id,
    name: classGroup.name
  });

  if (error) {
    throw error;
  }
};

export const deleteClassFromSupabase = async (classId: string): Promise<void> => {
  const supabase = ensureSupabaseClient();
  const { error } = await supabase.from('classes').delete().eq('id', classId);

  if (error) {
    throw error;
  }
};

export const addStudentToSupabase = async (classId: string, student: Student): Promise<void> => {
  const supabase = ensureSupabaseClient();
  const { error } = await supabase.from('students').insert({
    id: student.id,
    class_id: classId,
    number: student.number,
    name: student.name,
    bonus: student.bonus,
    minus: student.minus
  });

  if (error) {
    throw error;
  }
};

export const deleteStudentFromSupabase = async (studentId: string): Promise<void> => {
  const supabase = ensureSupabaseClient();
  const { error } = await supabase.from('students').delete().eq('id', studentId);

  if (error) {
    throw error;
  }
};

export const updateStudentMetricInSupabase = async (
  studentId: string,
  metric: StudentMetric,
  value: number
): Promise<void> => {
  const supabase = ensureSupabaseClient();
  const { error } = await supabase.from('students').update({ [metric]: value }).eq('id', studentId);

  if (error) {
    throw error;
  }
};

export const replaceAllDataInSupabase = async (classes: ClassGroup[]): Promise<void> => {
  const supabase = ensureSupabaseClient();

  const { error: deleteStudentsError } = await supabase.from('students').delete().not('id', 'is', null);
  if (deleteStudentsError) {
    throw deleteStudentsError;
  }

  const { error: deleteClassesError } = await supabase.from('classes').delete().not('id', 'is', null);
  if (deleteClassesError) {
    throw deleteClassesError;
  }

  if (classes.length === 0) {
    return;
  }

  const classRows = classes.map((cls) => ({
    id: cls.id,
    name: cls.name
  }));

  const { error: insertClassesError } = await supabase.from('classes').insert(classRows);
  if (insertClassesError) {
    throw insertClassesError;
  }

  const studentRows = classes.flatMap((cls) =>
    cls.students.map((student) => ({
      id: student.id,
      class_id: cls.id,
      number: student.number,
      name: student.name,
      bonus: student.bonus,
      minus: student.minus
    }))
  );

  if (studentRows.length === 0) {
    return;
  }

  const { error: insertStudentsError } = await supabase.from('students').insert(studentRows);
  if (insertStudentsError) {
    throw insertStudentsError;
  }
};
