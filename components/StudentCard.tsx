import React from 'react';
import { Student } from '../types';
import { PlusIcon, MinusIcon, TrashIcon } from './Icons';

interface StudentCardProps {
  student: Student;
  onUpdateBonus: (id: string, delta: number) => void;
  onUpdateMinus: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({ 
  student, 
  onUpdateBonus, 
  onUpdateMinus, 
  onDelete 
}) => {
  const netScore = student.bonus - student.minus;
  const isPositive = netScore > 0;
  const isNegative = netScore < 0;

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-[72px_minmax(0,1fr)_168px_168px_110px_44px] gap-4 md:gap-0 md:items-center transition-all duration-200 hover:shadow-md hover:border-indigo-100">
      {/* Student Number */}
      <div className="col-span-full md:col-span-1 flex items-center justify-start md:justify-center">
        <div className="flex items-center justify-center w-12 h-10 shrink-0 text-xl font-bold text-slate-300 tabular-nums">
          {student.number}
        </div>
      </div>

      {/* Student Name */}
      <div className="col-span-full md:col-span-1 min-w-0">
        <h3 className="text-base font-semibold text-slate-800 truncate" title={student.name}>
          {student.name}
        </h3>
      </div>

      {/* Bonus Controls */}
      <div className="col-span-full md:col-span-1 flex flex-col gap-2 md:items-center md:justify-self-center">
        <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wide md:hidden">Bonus</span>
        <div className="flex items-center bg-white rounded-lg border border-emerald-400 overflow-hidden w-full md:w-[168px]">
          <button
            onClick={() => onUpdateBonus(student.id, -1)}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 active:bg-emerald-100 transition-colors"
            disabled={student.bonus <= 0}
          >
            <MinusIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center font-bold text-emerald-700 text-2xl tabular-nums">
            {student.bonus}
          </div>
          <button
            onClick={() => onUpdateBonus(student.id, 1)}
            className="w-10 h-10 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Minus Controls */}
      <div className="col-span-full md:col-span-1 flex flex-col gap-2 md:items-center md:justify-self-center">
        <span className="text-xs font-semibold text-rose-500 uppercase tracking-wide md:hidden">Minus</span>
        <div className="flex items-center bg-white rounded-lg border border-rose-400 overflow-hidden w-full md:w-[168px]">
          <button
            onClick={() => onUpdateMinus(student.id, -1)}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100 transition-colors"
            disabled={student.minus <= 0}
          >
            <MinusIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center font-bold text-rose-700 text-2xl tabular-nums">
            {student.minus}
          </div>
          <button
            onClick={() => onUpdateMinus(student.id, 1)}
            className="w-10 h-10 flex items-center justify-center text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Total Score */}
      <div className="col-span-full md:col-span-1 flex flex-col items-center md:justify-self-center">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide md:hidden">Total</span>
        <span
          className={`text-3xl font-bold tabular-nums ${
            isPositive ? 'text-emerald-600' :
            isNegative ? 'text-rose-600' : 'text-slate-600'
          }`}
        >
          {netScore > 0 ? `+${netScore}` : netScore}
        </span>
      </div>

      {/* Actions */}
      <div className="col-span-full md:col-span-1 flex justify-end md:justify-self-end">
        <button 
          onClick={() => onDelete(student.id)}
          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
          title="Remove Student"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
