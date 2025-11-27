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
    <div className="group bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-center gap-4 transition-all duration-200 hover:shadow-md hover:border-indigo-200">
      
      {/* Student Info */}
      <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
        <div className="flex items-center justify-center w-12 h-10 shrink-0 text-xl font-bold text-slate-300">
          #{student.number}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-800 truncate" title={student.name}>
            {student.name}
          </h3>
        </div>
      </div>

      {/* Controls Container */}
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-lg">
        
        {/* Bonus Controls */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Bonus</span>
          <div className="flex items-center bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => onUpdateBonus(student.id, -1)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:bg-slate-100 transition-colors"
              disabled={student.bonus <= 0}
            >
              <MinusIcon className="w-3 h-3" />
            </button>
            <div className="w-10 text-center font-bold text-slate-700 text-sm">
              {student.bonus}
            </div>
            <button
              onClick={() => onUpdateBonus(student.id, 1)}
              className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 transition-colors"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Minus Controls */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Minus</span>
          <div className="flex items-center bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => onUpdateMinus(student.id, -1)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:bg-slate-100 transition-colors"
              disabled={student.minus <= 0}
            >
              <MinusIcon className="w-3 h-3" />
            </button>
            <div className="w-10 text-center font-bold text-slate-700 text-sm">
              {student.minus}
            </div>
            <button
              onClick={() => onUpdateMinus(student.id, 1)}
              className="w-8 h-8 flex items-center justify-center text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Total Score */}
        <div className="flex flex-col items-center gap-1 px-4 border-l border-slate-200 ml-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
          <span className={`text-xl font-bold ${
            isPositive ? 'text-emerald-600' : 
            isNegative ? 'text-rose-600' : 'text-slate-600'
          }`}>
            {netScore > 0 ? `+${netScore}` : netScore}
          </span>
        </div>
      </div>

      {/* Actions */}
      <button 
        onClick={() => onDelete(student.id)}
        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
        title="Remove Student"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
};