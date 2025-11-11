import React, { useState, useEffect } from 'react';
import { BookOpen, MessageSquare, Brain, Clock, Plus, Send, X, Lightbulb, CheckCircle } from 'lucide-react';

export default function AIStudyBuddy() {
  const [activeTab, setActiveTab] = useState('home');
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [studyStreak, setStudyStreak] = useState(0);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isTimerRunning && (timerMinutes > 0 || timerSeconds > 0)) {
      interval = setInterval(() => {
        if (timerSeconds === 0) {
          if (timerMinutes === 0) {
            setIsTimerRunning(false);
            setStudyStreak(prev => prev + 1);
            alert('🎉 Study session complete! Great job!');
          } else {
            setTimerMinutes(prev => prev - 1);
            setTimerSeconds(59);
          }
        } else {
          setTimerSeconds(prev => prev - 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerMinutes, timerSeconds]);

  const saveNote = () => {
    if (currentNote.trim()) {
      setNotes([...notes, { id: Date.now(), text: currentNote, date: new Date().toLocaleDateString() }]);
      setCurrentNote('');
    }
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const sendMessage = async () => {
    if (!userMessage.trim() || isLoading) return;

    const userMsg = { role: 'user', content: userMessage };
    setChatMessages(prev => [...prev, userMsg]);
    setUserMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [...chatMessages, userMsg].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          system: 'You are a helpful AI study assistant. Provide clear, concise explanations for student questions. Break down complex topics into easy-to-understand parts. Be encouraging and supportive.'
        })
      });

      const data = await response.json();
      const aiResponse = data.content.find(c => c.type === 'text')?.text || 'Sorry, I could not process that.';
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (notes.length === 0) {
      alert('Add some notes first to generate a quiz!');
      return;
    }

    setIsLoading(true);
    const noteContent = notes.map(n => n.text).join('\n\n');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Based on these study notes, generate 3 practice questions with answers:\n\n${noteContent}\n\nFormat as JSON array: [{"question": "...", "answer": "..."}]`
          }],
          system: 'Generate educational practice questions. Return ONLY valid JSON array, no other text.'
        })
      });

      const data = await response.json();
      const text = data.content.find(c => c.type === 'text')?.text || '[]';
      const cleanText = text.replace(/```json|```/g, '').trim();
      const questions = JSON.parse(cleanText);
      
      setQuizzes([...quizzes, { id: Date.now(), questions, date: new Date().toLocaleDateString() }]);
      setActiveTab('quiz');
    } catch (error) {
      alert('Could not generate quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = (mins) => {
    setTimerMinutes(mins);
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8" />
              <h1 className="text-2xl font-bold">AI Study Buddy</h1>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-90">Study Streak</div>
              <div className="text-xl font-bold">{studyStreak} 🔥</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 pb-24">
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome Back! 👋</h2>
              <p className="text-gray-600 mb-4">Ready to make learning easier? Choose what you need:</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('notes')}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  <BookOpen className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">My Notes</div>
                  <div className="text-xs opacity-90">{notes.length} saved</div>
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">Ask AI</div>
                  <div className="text-xs opacity-90">Get help</div>
                </button>

                <button
                  onClick={() => setActiveTab('quiz')}
                  className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  <Lightbulb className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">Quiz Me</div>
                  <div className="text-xs opacity-90">{quizzes.length} quizzes</div>
                </button>

                <button
                  onClick={() => setActiveTab('timer')}
                  className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">Study Timer</div>
                  <div className="text-xs opacity-90">Focus time</div>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-lg mb-2">💡 Quick Tip</h3>
              <p className="text-sm opacity-95">Use the Pomodoro technique: Study for 25 minutes, then take a 5-minute break. Your brain will thank you!</p>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                My Study Notes
              </h2>
              
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Type your notes here... Take your time and write clearly!"
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
              />
              
              <div className="flex gap-2 mt-3">
                <button
                  onClick={saveNote}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Save Note
                </button>
                <button
                  onClick={generateQuiz}
                  disabled={isLoading || notes.length === 0}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lightbulb className="w-5 h-5" />
                  {isLoading ? 'Generating...' : 'Generate Quiz'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {notes.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No notes yet. Start writing to remember better!</p>
                </div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="bg-white rounded-xl shadow p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500">{note.date}</span>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{note.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Ask Your AI Tutor
              </h2>
              <p className="text-sm text-gray-600">Ask any study question!</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-12">
                  <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">Your AI tutor is ready!</p>
                  <p className="text-sm">Ask anything: "Explain photosynthesis", "Help with algebra", etc.</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask a question..."
                  className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !userMessage.trim()}
                  className="bg-indigo-600 text-white px-6 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Lightbulb className="w-6 h-6" />
                Practice Quizzes
              </h2>

              {quizzes.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">No quizzes yet!</p>
                  <p className="text-sm mb-4">Add notes, then click "Generate Quiz" to create practice questions.</p>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Go to Notes
                  </button>
                </div>
              ) : (
                quizzes.map(quiz => (
                  <div key={quiz.id} className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-3">Generated on {quiz.date}</div>
                    <div className="space-y-4">
                      {quiz.questions.map((q, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg">
                          <p className="font-semibold text-gray-800 mb-2">Q{idx + 1}: {q.question}</p>
                          <details className="text-sm text-gray-600">
                            <summary className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium">
                              Show Answer
                            </summary>
                            <p className="mt-2 p-3 bg-green-50 rounded border-l-4 border-green-500">{q.answer}</p>
                          </details>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'timer' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-center gap-2">
                <Clock className="w-6 h-6" />
                Study Timer (Pomodoro)
              </h2>

              <div className="mb-8">
                <div className="text-7xl font-bold text-indigo-600 mb-4">
                  {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-600">
                  {isTimerRunning ? '⏰ Focus time!' : '⏸️ Ready to study?'}
                </div>
              </div>

              <div className="space-y-3">
                {isTimerRunning ? (
                  <button
                    onClick={() => setIsTimerRunning(false)}
                    className="w-full bg-red-500 text-white py-4 rounded-xl font-semibold hover:bg-red-600 transition-colors"
                  >
                    Pause Timer
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => startTimer(25)}
                      className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Start 25 min Focus Session
                    </button>
                    <button
                      onClick={() => startTimer(5)}
                      className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                    >
                      Start 5 min Break
                    </button>
                    <button
                      onClick={() => startTimer(15)}
                      className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                    >
                      Start 15 min Quick Study
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-lg mb-2">🎯 Pomodoro Technique</h3>
              <ul className="text-sm space-y-1 opacity-95">
                <li>• Study focused for 25 minutes</li>
                <li>• Take a 5-minute break</li>
                <li>• After 4 sessions, take a 15-30 min break</li>
                <li>• Stay consistent and watch your productivity soar!</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-around p-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              activeTab === 'home' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <Brain className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              activeTab === 'notes' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-xs mt-1">Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              activeTab === 'chat' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs mt-1">Ask AI</span>
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              activeTab === 'quiz' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <Lightbulb className="w-6 h-6" />
            <span className="text-xs mt-1">Quiz</span>
          </button>
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              activeTab === 'timer' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <Clock className="w-6 h-6" />
            <span className="text-xs mt-1">Timer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
