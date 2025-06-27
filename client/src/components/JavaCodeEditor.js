import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiTerminal, FiPlay, FiPause, FiSquare, FiClock } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

const JavaCodeEditor = ({
  initialCode = '',
  readOnly = false,
  time,
  isRunning,
  formatTime,
  startStopwatch,
  pauseStopwatch,
  resetStopwatch
}) => {
  const [code, setCode] = useState(initialCode || `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`);
  const [output, setOutput] = useState('');
  const [internalIsExecuting, setInternalIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const textareaRef = useRef(null);

  const executeCode = async () => {
    if (!code.trim()) {
      toast.error('Please enter some Java code to execute');
      return;
    }

    setInternalIsExecuting(true);
    setOutput('');
    setExecutionResult(null);

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
      setExecutionResult(result);

      if (result.success) {
        // Format output
        let outputText = '';
        
        if (result.compile.stderr) {
          outputText += `Compilation Errors:\n${result.compile.stderr}\n\n`;
        }
        
        if (result.run.stdout) {
          outputText += `Output:\n${result.run.stdout}\n`;
        }
        
        if (result.run.stderr) {
          outputText += `Runtime Errors:\n${result.run.stderr}\n`;
        }
        
        if (!outputText.trim()) {
          outputText = 'Code executed successfully with no output.';
        }
        
        setOutput(outputText);
        
        if (result.hasErrors) {
          toast.error('Code execution completed with errors');
        } else {
          toast.success('Code executed successfully!');
        }
      } else {
        setOutput(`Error: ${result.message}`);
        toast.error(result.message);
      }

    } catch (error) {
      console.error('Execution error:', error);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setOutput('Error: Code execution timed out. Please check for infinite loops.');
        toast.error('Execution timed out');
      } else if (error.response) {
        const errorMsg = error.response.data?.message || 'Server error during execution';
        setOutput(`Error: ${errorMsg}`);
        toast.error(errorMsg);
      } else {
        setOutput('Error: Failed to connect to execution service');
        toast.error('Connection error');
      }
    } finally {
      setInternalIsExecuting(false);
    }
  };

  // Listen for external execute events
  useEffect(() => {
    const handleExecuteEvent = () => {
      executeCode();
    };

    window.addEventListener('executeCode', handleExecuteEvent);
    return () => {
      window.removeEventListener('executeCode', handleExecuteEvent);
    };
  }, [executeCode]);



  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);

      // Set cursor position after the tab
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const lines = code.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];

      // Calculate indentation based on Java structure
      let indent = '';
      let baseIndent = '';

      // Get base indentation of current line
      const match = currentLine.match(/^(\s*)/);
      if (match) {
        baseIndent = match[1];
      }

      // Check if current line ends with opening brace
      if (currentLine.trim().endsWith('{')) {
        indent = baseIndent + '    '; // Add 4 spaces for new block
      } else if (currentLine.trim().endsWith(';') || currentLine.trim() === '') {
        indent = baseIndent; // Same indentation
      } else {
        indent = baseIndent; // Default to same indentation
      }

      // Check if we need to reduce indentation (closing brace)
      const nextChar = code.charAt(start);
      if (nextChar === '}') {
        // If next character is closing brace, reduce indent
        if (indent.length >= 4) {
          indent = indent.substring(4);
        }
      }

      const newCode = code.substring(0, start) + '\n' + indent + code.substring(start);
      setCode(newCode);

      // Set cursor position after the indentation
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1 + indent.length;
      }, 0);
    } else if (e.key === '}') {
      // Auto-dedent when typing closing brace
      const start = e.target.selectionStart;
      const lines = code.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];

      if (currentLine.trim() === '' && currentLine.length >= 4) {
        // Remove 4 spaces of indentation
        const newCurrentLine = currentLine.substring(4);
        const beforeCurrentLine = lines.slice(0, -1).join('\n');
        const afterCursor = code.substring(start);

        const newCode = beforeCurrentLine + (beforeCurrentLine ? '\n' : '') + newCurrentLine + '}' + afterCursor;
        setCode(newCode);

        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = start - 4 + 1;
        }, 0);
        return;
      }

      // Default behavior for closing brace
      const newCode = code.substring(0, start) + '}' + code.substring(start);
      setCode(newCode);

      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1;
      }, 0);
    }
  };

  return (
    <div className="h-[623.5px] flex flex-col  bg-white overflow-hidden">
      {/* Header with Run Button and Timer */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Run Button */}
            <button
              onClick={executeCode}
              disabled={internalIsExecuting}
              className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded font-medium transition-colors space-x-1.5"
            >
              <FiPlay className="h-3.5 w-3.5" />
              <span>{internalIsExecuting ? 'Running...' : 'Run'}</span>
            </button>

            {/* Stopwatch */}
            {time !== undefined && formatTime && (
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded border">
                <FiClock className="h-3.5 w-3.5 text-gray-600" />
                <span className="text-sm font-mono font-medium text-gray-800 min-w-[60px]">
                  {formatTime(time)}
                </span>
                <div className="flex items-center space-x-1">
                  {!isRunning ? (
                    <button
                      onClick={startStopwatch}
                      className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      title="Start Timer"
                    >
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={pauseStopwatch}
                      className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors flex items-center"
                      title="Pause Timer"
                    >
                      <FiPause className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={resetStopwatch}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center"
                    title="Reset Timer"
                  >
                    <FiSquare className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-gray-600">
            Java Compiler
          </div>
        </div>
      </div>

    {/* Code Editor */}
    <div className="flex-grow min-h-[56%] max-h-[64%] p-1 rounded-md relative overflow-hidden">
      {!readOnly ? (
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-4 font-mono rounded-md text-sm bg-gray-900 text-gray-100 border-0 resize-none focus:outline-none focus:ring-0 overflow-y-auto"
          placeholder="Enter your Java code here..."
          style={{
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            lineHeight: '1.5',
            tabSize: 4
          }}
        />
      ) : (
        <div className="bg-gray-900 h-full overflow-auto">
          <SyntaxHighlighter
            style={tomorrow}
            language="java"
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
              height: '100%',
              overflowY: 'auto'
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      )}
    </div>

    {/* Output Section */}
    <div className="flex-shrink-0 flex flex-col max-h-[26.5%] border-t  border-gray-200">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <FiTerminal className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Compiler Output</span>
          {executionResult && (
            <span className={`text-xs px-2 py-1 rounded ${
              executionResult.hasErrors
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {executionResult.hasErrors ? 'Error' : 'Success'}
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50 p-1">
        {output ? (
          <pre className="text-sm font-mono whitespace-pre-wrap bg-gray-900 text-gray-100 p-3 rounded break-words">
            {output}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-[30px] text-gray-500 p-3">
            <div className="text-center">
              <FiTerminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Click "Run" to execute your code</p>
              <p className="text-xs mt-1">Output will show here</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default JavaCodeEditor;
