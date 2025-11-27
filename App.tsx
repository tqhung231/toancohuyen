import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClassGroup, Student, AIInsightState } from './types';
import { StudentCard } from './components/StudentCard';
import { UsersIcon, PlusIcon, SparklesIcon, XIcon, TrophyIcon, DownloadIcon, UploadIcon } from './components/Icons';
import { generateClassReport } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';

const STORAGE_KEY = 'classtrack-data-v2';

const INITIAL_DATA: ClassGroup[] = [
  {
    id: 'class-1',
    name: 'Class 1A',
    students: [
      { id: 's1', number: 1, name: 'Alice Johnson', bonus: 5, minus: 0 },
      { id: 's2', number: 2, name: 'Bob Smith', bonus: 2, minus: 4 },
      { id: 's3', number: 3, name: 'Charlie Davis', bonus: 8, minus: 1 },
    ],
  },
  {
    id: 'class-2',
    name: 'Science 101',
    students: [
      { id: 's4', number: 1, name: 'Dana Lee', bonus: 1, minus: 1 },
      { id: 's5', number: 2, name: 'Evan Wright', bonus: 3, minus: 0 },
    ],
  }
];

export default function App() {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Helper for initial data loading with migration logic
  const getInitialClasses = (): ClassGroup[] => {
    // Note: The useLocalStorage hook will first check STORAGE_KEY. 
    // This helper is primarily for the fallback (v1 migration or default data).
    
    // Check for v1 data (migration) if v2 doesn't exist (handled by hook's logic flow)
    if (typeof window !== 'undefined') {
      const savedV1 = localStorage.getItem('classtrack-data-v1');
      if (savedV1) {
        try {
          const v1Data = JSON.parse(savedV1);
          console.log("Migrating v1 data...");
          // Migrate simple score to bonus/minus
          return v1Data.map((cls: any) => ({
            ...cls,
            students: cls.students.map((s: any, idx: number) => ({
              id: s.id,
              name: s.name,
              number: idx + 1,
              bonus: s.score > 0 ? s.score : 0,
              minus: s.score < 0 ? Math.abs(s.score) : 0
            }))
          }));
        } catch (e) {
          console.error("Failed to migrate v1 data", e);
        }
      }
    }
    return INITIAL_DATA;
  };

  // App State with Persistence
  const [classes, setClasses] = useLocalStorage<ClassGroup[]>(STORAGE_KEY, getInitialClasses);
  
  // Data patching effect: Ensure all loaded students have numbers (self-healing for v2 data)
  useEffect(() => {
    if (classes.length > 0) {
      let needsUpdate = false;
      const patchedClasses = classes.map(cls => ({
        ...cls,
        students: cls.students.map((s, idx) => {
          if (typeof s.number !== 'number') {
            needsUpdate = true;
            return { ...s, number: idx + 1 };
          }
          return s;
        })
      }));
      
      if (needsUpdate) {
        console.log("Patching missing student numbers...");
        setClasses(patchedClasses);
      }
    }
  }, [classes.length]); // Run lightly, mainly on mount or import

  const [activeClassId, setActiveClassId] = useState<string>(() => {
     // We can't easily rely on 'classes' here during init if it comes from the hook async-like
     // But useLocalStorage is synchronous for initial render.
     // However, simpler to just start empty or effect-based, but let's try to grab first.
     return '';
  });

  // Sync active class when classes load/change
  useEffect(() => {
    if (!activeClassId && classes.length > 0) {
      setActiveClassId(classes[0].id);
    } else if (activeClassId && !classes.find(c => c.id === activeClassId)) {
      // Active class was deleted
      setActiveClassId(classes.length > 0 ? classes[0].id : '');
    }
  }, [classes, activeClassId]);

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const [aiInsight, setAiInsight] = useState<AIInsightState>({
    loading: false,
    content: null,
    error: null
  });
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived State
  const activeClass = classes.find(c => c.id === activeClassId);

  // Handlers - Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'huyenlk38' && password === '123456789') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  // Handlers - Students
  const updateStudentPoints = useCallback((studentId: string, type: 'bonus' | 'minus', delta: number) => {
    if (!activeClassId) return;
    
    setClasses(prevClasses => prevClasses.map(cls => {
      if (cls.id !== activeClassId) return cls;
      return {
        ...cls,
        students: cls.students.map(student => {
          if (student.id !== studentId) return student;
          
          const newValue = Math.max(0, student[type] + delta); // Prevent negative counts
          return { ...student, [type]: newValue };
        })
      };
    }));
  }, [activeClassId, setClasses]);

  const handleOpenAddStudentModal = () => {
    if (!activeClass) return;
    const maxNum = activeClass.students.reduce((max, s) => Math.max(max, s.number || 0), 0);
    setNewStudentNumber((maxNum + 1).toString());
    setNewStudentName('');
    setIsAddStudentModalOpen(true);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !activeClassId || !newStudentNumber) return;

    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: newStudentName.trim(),
      number: parseInt(newStudentNumber, 10),
      bonus: 0,
      minus: 0
    };

    setClasses(prev => prev.map(cls => 
      cls.id === activeClassId 
        ? { ...cls, students: [...cls.students, newStudent] } 
        : cls
    ));

    setNewStudentName('');
    setNewStudentNumber('');
    setIsAddStudentModalOpen(false);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!window.confirm("Are you sure you want to remove this student?")) return;
    
    setClasses(prev => prev.map(cls => 
      cls.id === activeClassId
        ? { ...cls, students: cls.students.filter(s => s.id !== studentId) }
        : cls
    ));
  };

  // Handlers - Classes
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newClass: ClassGroup = {
      id: crypto.randomUUID(),
      name: newClassName.trim(),
      students: []
    };

    setClasses(prev => [...prev, newClass]);
    setActiveClassId(newClass.id);
    setNewClassName('');
    setIsAddClassModalOpen(false);
  };

  const handleDeleteClass = (classId: string) => {
    if (!window.confirm("Delete this class and all its students?")) return;
    
    const newClasses = classes.filter(c => c.id !== classId);
    setClasses(newClasses);
    // Active class update handled by useEffect
  };

  // Handlers - Data Management
  const handleExportData = () => {
    const dataStr = JSON.stringify(classes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `classtrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content === 'string') {
          const parsedData = JSON.parse(content);
          if (Array.isArray(parsedData)) {
            // Basic validation: Check if it has classes structure
            const isValid = parsedData.every((item: any) => item.id && item.name && Array.isArray(item.students));
            
            if (isValid) {
              if (window.confirm("This will replace your current data with the imported file. Continue?")) {
                setClasses(parsedData);
                alert("Data imported successfully!");
              }
            } else {
              alert("Invalid file format. Please import a valid ClassTrack JSON file.");
            }
          } else {
            alert("Invalid file format. Data must be an array of classes.");
          }
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to parse the file. Please ensure it is a valid JSON.");
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Handlers - AI
  const handleGenerateInsight = async () => {
    if (!activeClass) return;
    
    setIsInsightModalOpen(true);
    setAiInsight({ loading: true, content: null, error: null });
    
    const report = await generateClassReport(activeClass.name, activeClass.students);
    
    setAiInsight({
      loading: false,
      content: report,
      error: null
    });
  };

  // Render Helpers
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <div className="bg-slate-100 p-4 rounded-full mb-4">
        <UsersIcon className="w-12 h-12 text-slate-300" />
      </div>
      <h3 className="text-xl font-medium text-slate-600 mb-2">No Students Yet</h3>
      <p className="max-w-md text-center mb-6">
        Get started by adding students to this class. You can track their bonus and minus points separately.
      </p>
      <button 
        onClick={handleOpenAddStudentModal}
        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
      >
        Add First Student
      </button>
    </div>
  );

  const sortedStudents = activeClass 
    ? [...activeClass.students].sort((a, b) => (a.number || 0) - (b.number || 0)) 
    : [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-600 p-3 rounded-xl shadow-md transform rotate-3">
              <TrophyIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Welcome Back</h2>
          <p className="text-center text-slate-500 mb-8">Sign in to ClassTrack</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                placeholder="Enter your password"
              />
            </div>
            
            {loginError && (
              <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg flex items-center justify-center font-medium animate-pulse">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              Sign In
            </button>
          </form>
          <p className="mt-8 text-center text-xs text-slate-400">
            Protected Student Tracking System
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">ClassTrack</h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {activeClass && (
                <>
                  <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1 mr-2">
                     <button 
                      onClick={handleExportData}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all"
                      title="Export Data to JSON"
                     >
                       <DownloadIcon className="w-4 h-4" />
                     </button>
                     <div className="w-px h-4 bg-slate-300 mx-1"></div>
                     <button 
                      onClick={handleImportClick}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all"
                      title="Import Data from JSON"
                     >
                       <UploadIcon className="w-4 h-4" />
                     </button>
                     <input 
                       type="file" 
                       ref={fileInputRef} 
                       onChange={handleImportFile} 
                       className="hidden" 
                       accept="application/json"
                     />
                  </div>

                  <button 
                    onClick={handleGenerateInsight}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-full text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    <span>AI Insights</span>
                  </button>
                </>
              )}
              <button 
                onClick={() => setIsAuthenticated(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 ml-1"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Scroll Area */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto hide-scrollbar">
          <div className="flex space-x-2 py-2">
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => setActiveClassId(cls.id)}
                className={`
                  whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                  ${activeClassId === cls.id 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                    : 'bg-white border-transparent text-slate-600 hover:bg-slate-100'
                  }
                `}
              >
                {cls.name}
              </button>
            ))}
            <button
              onClick={() => setIsAddClassModalOpen(true)}
              className="whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors flex items-center gap-1 border border-dashed border-slate-300"
            >
              <PlusIcon className="w-4 h-4" />
              New Class
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeClass ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{activeClass.name}</h2>
                <div className="flex gap-2 text-sm text-slate-500 mt-1">
                  <span>{activeClass.students.length} Students</span>
                  <span>•</span>
                  <span>Total Bonus: {activeClass.students.reduce((acc, s) => acc + s.bonus, 0)}</span>
                </div>
              </div>
              <div className="flex w-full sm:w-auto gap-2">
                 <button 
                  onClick={() => handleDeleteClass(activeClass.id)}
                  className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-rose-100"
                >
                  Delete Class
                </button>
                <button 
                  onClick={handleOpenAddStudentModal}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-all active:scale-95"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Add Student</span>
                </button>
              </div>
            </div>

            {sortedStudents.length > 0 ? (
              <div className="flex flex-col gap-3">
                 {/* List Header (Hidden on mobile) */}
                 <div className="hidden md:flex px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <div className="flex-1 flex gap-4">
                      <span className="w-12 text-center">No.</span>
                      <span>Student</span>
                    </div>
                 </div>

                {sortedStudents.map(student => (
                  <StudentCard 
                    key={student.id} 
                    student={student}
                    onUpdateBonus={(id, delta) => updateStudentPoints(id, 'bonus', delta)}
                    onUpdateMinus={(id, delta) => updateStudentPoints(id, 'minus', delta)}
                    onDelete={handleDeleteStudent}
                  />
                ))}
              </div>
            ) : (
              renderEmptyState()
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to ClassTrack</h2>
            <p className="text-slate-500 mb-6">Create a class to start tracking student performance.</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button 
                onClick={() => setIsAddClassModalOpen(true)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Create Your First Class
              </button>
              <div className="flex gap-2">
                 <button 
                   onClick={handleImportClick}
                   className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                 >
                   <UploadIcon className="w-4 h-4" />
                   Import Data
                 </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button for AI (Mobile Only) */}
      {activeClass && (
        <button 
          onClick={handleGenerateInsight}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center z-40 hover:scale-110 active:scale-90 transition-transform"
        >
          <SparklesIcon className="w-6 h-6" />
        </button>
      )}

      {/* Add Student Modal */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add New Student</h3>
              <button onClick={() => setIsAddStudentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddStudent}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Student Number</label>
                <input
                  type="number"
                  value={newStudentNumber}
                  onChange={(e) => setNewStudentNumber(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Student Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newStudentName.trim() || !newStudentNumber}
                  className="px-6 py-2 bg-indigo-600 disabled:bg-indigo-300 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Create New Class</h3>
              <button onClick={() => setIsAddClassModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddClass}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Class Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. History 101"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newClassName.trim()}
                  className="px-6 py-2 bg-indigo-600 disabled:bg-indigo-300 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Insight Modal */}
      {isInsightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                    <SparklesIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Class Insights</h3>
                    <p className="text-indigo-100 text-sm">Powered by Gemini AI</p>
                  </div>
                </div>
                <button onClick={() => setIsInsightModalOpen(false)} className="text-white/70 hover:text-white">
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto">
              {aiInsight.loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-500 font-medium">Analyzing student performance...</p>
                </div>
              ) : aiInsight.error ? (
                <div className="text-center py-4 text-rose-500">
                  <p>{aiInsight.error}</p>
                </div>
              ) : (
                <div className="prose prose-indigo text-slate-700 leading-relaxed">
                  {aiInsight.content?.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-3">{paragraph}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsInsightModalOpen(false)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}