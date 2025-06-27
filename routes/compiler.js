const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

// Piston API configuration
const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

// @route   POST /api/compiler/execute
// @desc    Execute Java code
// @access  Private (authenticated users only)
router.post('/execute', auth, async (req, res) => {
  try {
    const { code, input = '' } = req.body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Code is required and must be a string' 
      });
    }

    // Prepare the request for Piston API
    const pistonRequest = {
      language: 'java',
      version: '15.0.2',
      files: [
        {
          name: 'Main.java',
          content: code
        }
      ],
      stdin: input,
      args: [],
      compile_timeout: 10000,  // 10 seconds
      run_timeout: 3000        // 3 seconds
    };

    // Make request to Piston API
    const response = await axios.post(`${PISTON_API_URL}/execute`, pistonRequest, {
      timeout: 15000, // 15 seconds total timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    // Format the response
    const executionResult = {
      success: true,
      language: result.language,
      version: result.version,
      compile: {
        stdout: result.compile?.stdout || '',
        stderr: result.compile?.stderr || '',
        code: result.compile?.code || 0,
        signal: result.compile?.signal || null
      },
      run: {
        stdout: result.run?.stdout || '',
        stderr: result.run?.stderr || '',
        code: result.run?.code || 0,
        signal: result.run?.signal || null,
        output: result.run?.output || ''
      }
    };

    // Determine if execution was successful
    const hasCompileErrors = result.compile?.stderr && result.compile.stderr.trim() !== '';
    const hasRuntimeErrors = result.run?.stderr && result.run.stderr.trim() !== '';
    const hasOutput = result.run?.stdout && result.run.stdout.trim() !== '';

    executionResult.hasErrors = hasCompileErrors || hasRuntimeErrors;
    executionResult.hasOutput = hasOutput;

    res.json(executionResult);

  } catch (error) {
    console.error('Compiler execution error:', error);

    // Handle different types of errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return res.status(408).json({
        success: false,
        message: 'Code execution timed out. Please check for infinite loops or optimize your code.',
        error: 'TIMEOUT'
      });
    }

    if (error.response) {
      // Piston API returned an error
      return res.status(error.response.status).json({
        success: false,
        message: 'Code execution service error',
        error: error.response.data || 'Unknown API error'
      });
    }

    if (error.request) {
      // Network error
      return res.status(503).json({
        success: false,
        message: 'Code execution service is currently unavailable',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    // Other errors
    res.status(500).json({
      success: false,
      message: 'Internal server error during code execution',
      error: 'INTERNAL_ERROR'
    });
  }
});

// @route   GET /api/compiler/languages
// @desc    Get available languages (for future expansion)
// @access  Private
router.get('/languages', auth, async (req, res) => {
  try {
    const response = await axios.get(`${PISTON_API_URL}/runtimes`, {
      timeout: 5000
    });

    // Filter for Java only for now
    const javaRuntimes = response.data.filter(runtime => 
      runtime.language === 'java'
    );

    res.json({
      success: true,
      languages: javaRuntimes
    });

  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available languages',
      error: error.message
    });
  }
});

// @route   POST /api/compiler/validate
// @desc    Validate Java code syntax without execution
// @access  Private
router.post('/validate', auth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Code is required and must be a string' 
      });
    }

    // Use Piston API to compile only (no execution)
    const pistonRequest = {
      language: 'java',
      version: '15.0.2',
      files: [
        {
          name: 'Main.java',
          content: code
        }
      ],
      compile_timeout: 10000,
      run_timeout: 0  // Don't run, just compile
    };

    const response = await axios.post(`${PISTON_API_URL}/execute`, pistonRequest, {
      timeout: 12000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;
    const hasCompileErrors = result.compile?.stderr && result.compile.stderr.trim() !== '';

    res.json({
      success: true,
      valid: !hasCompileErrors,
      compile: {
        stdout: result.compile?.stdout || '',
        stderr: result.compile?.stderr || '',
        code: result.compile?.code || 0
      }
    });

  } catch (error) {
    console.error('Code validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Code validation failed',
      error: error.message
    });
  }
});

module.exports = router;
