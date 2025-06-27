import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiCode, FiPlay, FiLoader, FiClock, FiPause, FiSquare } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import JavaCodeEditor from '../components/JavaCodeEditor';

const CompilerPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const problemId = searchParams.get('problem');
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stopwatch state
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // Code execution state
  const [isExecuting, setIsExecuting] = useState(false);

  // Stopwatch effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Stopwatch functions
  const startStopwatch = () => {
    setIsRunning(true);
  };

  const pauseStopwatch = () => {
    setIsRunning(false);
  };

  const resetStopwatch = () => {
    setTime(0);
    setIsRunning(false);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Code execution handler
  const handleCodeExecution = async (code) => {
    if (!code.trim()) {
      toast.error('Please enter some Java code to execute');
      return;
    }

    setIsExecuting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/compiler/execute', {
        code: code
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000 // 20 seconds timeout
      });

      const result = response.data;

      if (result.success) {
        toast.success('Code executed successfully!');
      } else {
        toast.error('Code execution failed');
      }
    } catch (error) {
      console.error('Execution error:', error);
      if (error.code === 'ECONNABORTED') {
        toast.error('Execution timeout - code took too long to run');
      } else if (error.response?.status === 500) {
        toast.error('Server error during execution');
      } else {
        toast.error('Connection error');
      }
    } finally {
      setIsExecuting(false);
    }
  };

  // Fetch problem data
  const fetchProblem = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/content/${problemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProblem(response.data);
    } catch (error) {
      console.error('Error fetching problem:', error);
      setError('Failed to load problem');
      toast.error('Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (problemId) {
      fetchProblem();
    } else {
      setError('No problem specified');
      setLoading(false);
    }
  }, [problemId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading compiler...</p>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Problem not found'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[623.5px] bg-gray-50 flex">
      {/* Left Side - Header + Content */}
      <div className="w-1/2 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-1 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-2 py-2 text-sm border-2 border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="mr-2 h-4 w-4 " />
              
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{problem.title}</h1>

              <div className="flex items-center space-x-2 mt-1">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                  {problem.category}
                </span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                  {problem.subTopic}
                </span>
                {problem.difficulty && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    problem.difficulty === 'Easy'
                      ? 'bg-green-100 text-green-700'
                      : problem.difficulty === 'Medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {problem.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Left Panel Content - Problem Description */}
        <div className="flex-1 overflow-y-auto p-4 border-r border-gray-200 bg-white">
          <div className="space-y-4">
            {/* Problem Statement */}
            {problem.problemStatement && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Problem Statement</h3>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{problem.problemStatement}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Constraints */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Constraints & Details</h3>
              <div className="prose prose-sm max-w-none bg-gray-50 p-3 rounded border border-gray-200">
                <ReactMarkdown>{problem.content}</ReactMarkdown>
              </div>
            </div>

            {/* Images */}
            {problem.images && problem.images.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Examples</h3>
                <div className={`grid gap-3 ${problem.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {problem.images.map((image, index) => (
                    <div key={index} className="bg-white rounded border border-gray-200 overflow-hidden">
                      <img
                        src={image.url}
                        alt={`Example ${index + 1}`}
                        className="w-full h-auto object-contain"
                        style={{ backgroundColor: 'transparent' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Solution */}
            {problem.solution && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <h3 className="text-sm font-semibold text-green-900 mb-2">Solution</h3>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{problem.solution}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Code Editor (Starts from Top) */}
      <div className="w-1/2 bg-white">
        <JavaCodeEditor
          initialCode={problem.codeExample || '// Write your Java code here\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'}
          readOnly={false}
          time={time}
          isRunning={isRunning}
          formatTime={formatTime}
          startStopwatch={startStopwatch}
          pauseStopwatch={pauseStopwatch}
          resetStopwatch={resetStopwatch}
        />
      </div>
    </div>
  );
};

export default CompilerPage;
