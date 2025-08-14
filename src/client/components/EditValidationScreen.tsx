import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { testSuite, TestCase, getTestsByCategory } from '../../lib/testSuite';

interface StructuredHealthData {
  date: string | null;
  screenTimeHours: number | null;
  workouts: Array<{
    type: string;
    durationMinutes: number;
    distanceKm?: number;
    intensity: number;
    notes?: string;
  }>;
  meals: Array<{
    type: string;
    notes: string;
  }>;
  waterIntakeLiters: number | null;
  painDiscomfort?: {
    location: string | null;
    intensity: number | null;
    notes: string | null;
  };
  sleep: {
    hours: number | null;
    quality: number | null;
  };
  energyLevel: number | null;
  mood: {
    rating: number | null;
    notes: string | null;
  };
  weightKg: number | null;
  otherActivities: string | null;
  notes: string | null;
}

interface JudgeResult {
  score: number;
  passed: boolean;
  analysis: {
    completeness: number;
    accuracy: number;
    preservation: number;
    schema: number;
  };
  issues: string[];
  explanation: string;
}

interface ValidationResult {
  success: boolean;
  originalData: StructuredHealthData;
  updateTranscript: string;
  resultData: StructuredHealthData;
  judgeResult?: JudgeResult;
  error?: string;
  timestamp: string;
  testCase?: TestCase;
}

export function EditValidationScreen() {
  const navigate = useNavigate();
  const [originalJson, setOriginalJson] = useState(`{
  "date": "2024-01-15",
  "screenTimeHours": 4,
  "workouts": [
    {
      "type": "run",
      "durationMinutes": 30,
      "distanceKm": 5,
      "intensity": 7,
      "notes": "morning run"
    }
  ],
  "meals": [
    {
      "type": "Breakfast",
      "notes": "oatmeal with berries"
    },
    {
      "type": "Lunch", 
      "notes": "quinoa salad"
    }
  ],
  "waterIntakeLiters": 2.0,
  "painDiscomfort": null,
  "sleep": {
    "hours": 7,
    "quality": 8
  },
  "energyLevel": 7,
  "mood": {
    "rating": 8,
    "notes": "feeling good"
  },
  "weightKg": null,
  "otherActivities": null,
  "notes": null
}`);

  const [updateText, setUpdateText] = useState("I also had a protein shake after my workout and my mood was actually more like a 9 today");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [testHistory, setTestHistory] = useState<ValidationResult[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [expandedHistoryItem, setExpandedHistoryItem] = useState<string | null>(null);
  const [runningBulkTest, setRunningBulkTest] = useState(false);
  const [bulkTestProgress, setBulkTestProgress] = useState({ current: 0, total: 0 });
  const [showTestSuite, setShowTestSuite] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const runValidationTest = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Parse the original JSON to validate it
      const originalData = JSON.parse(originalJson);
      
      // Call the merge API
      const response = await fetch('/api/update-health-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalData,
          updateTranscript: updateText
        }),
      });

      const data = await response.json();
      
      let judgeResult: JudgeResult | undefined;
      
      // If merge was successful, get AI judge evaluation
      if (response.ok && data.success && data.data) {
        try {
          console.log("Getting AI judge evaluation...");
          console.log("Judge request data:", { originalData, updateTranscript: updateText, resultData: data.data });
          
          const judgeResponse = await fetch('/api/judge-health-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              originalData,
              updateTranscript: updateText,
              resultData: data.data
            }),
          });
          
          console.log("Judge response status:", judgeResponse.status);
          
          if (judgeResponse.ok) {
            const judgeData = await judgeResponse.json();
            judgeResult = judgeData.judge;
            console.log("AI judge evaluation completed, score:", judgeResult?.score);
            console.log("Full judge result:", judgeResult);
          } else {
            const errorText = await judgeResponse.text();
            console.error("Judge API error:", judgeResponse.status, errorText);
          }
        } catch (judgeError) {
          console.error("Error getting judge evaluation:", judgeError);
          // Continue without judge result
        }
      } else {
        console.log("Skipping judge evaluation - merge was not successful or no result data");
      }
      
      const testResult: ValidationResult = {
        success: response.ok && data.success,
        originalData,
        updateTranscript: updateText,
        resultData: data.data || null,
        judgeResult,
        error: data.error || (!response.ok ? `HTTP ${response.status}` : undefined),
        timestamp: new Date().toISOString(),
        testCase: selectedTestCase || undefined
      };

      setResult(testResult);
      setTestHistory(prev => [testResult, ...prev.slice(0, 9)]); // Keep last 10 results

    } catch (error) {
      const testResult: ValidationResult = {
        success: false,
        originalData: {} as StructuredHealthData,
        updateTranscript: updateText,
        resultData: {} as StructuredHealthData,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      setResult(testResult);
      setTestHistory(prev => [testResult, ...prev.slice(0, 9)]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPresetTest = (preset: string) => {
    switch (preset) {
      case 'additive':
        setUpdateText("I also had a protein shake after my workout and forgot to mention I did 10 minutes of stretching");
        break;
      case 'correction':
        setUpdateText("Actually, my workout was 45 minutes, not 30, and my mood was more like a 9");
        break;
      case 'addition':
        setUpdateText("I forgot to mention I had dinner - grilled chicken with vegetables");
        break;
      case 'complex':
        setUpdateText("Change my sleep to 6 hours because I woke up early, also add that I had coffee with lunch, and my energy level was really more like a 5");
        break;
    }
    setSelectedTestCase(null);
  };

  const loadTestCase = (testCase: TestCase) => {
    setOriginalJson(JSON.stringify(testCase.originalData, null, 2));
    setUpdateText(testCase.updateTranscript);
    setSelectedTestCase(testCase);
  };

  const runBulkTests = async (category?: TestCase['category']) => {
    const testsToRun = category ? getTestsByCategory(category) : testSuite;
    setRunningBulkTest(true);
    setBulkTestProgress({ current: 0, total: testsToRun.length });
    
    const results: ValidationResult[] = [];
    
    for (let i = 0; i < testsToRun.length; i++) {
      const testCase = testsToRun[i];
      setBulkTestProgress({ current: i + 1, total: testsToRun.length });
      
      try {
        // Set up test case
        const originalData = testCase.originalData;
        const updateTranscript = testCase.updateTranscript;
        
        // Run merge
        const response = await fetch('/api/update-health-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalData, updateTranscript }),
        });
        
        const data = await response.json();
        
        // Run judge if merge successful
        let judgeResult: JudgeResult | undefined;
        if (response.ok && data.success && data.data) {
          try {
            const judgeResponse = await fetch('/api/judge-health-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                originalData,
                updateTranscript,
                resultData: data.data
              }),
            });
            
            if (judgeResponse.ok) {
              const judgeData = await judgeResponse.json();
              judgeResult = judgeData.judge;
            }
          } catch (judgeError) {
            console.error("Judge error for test", testCase.id, judgeError);
          }
        }
        
        const testResult: ValidationResult = {
          success: response.ok && data.success,
          originalData,
          updateTranscript,
          resultData: data.data || null,
          judgeResult,
          error: data.error || (!response.ok ? `HTTP ${response.status}` : undefined),
          timestamp: new Date().toISOString(),
          testCase
        };
        
        results.push(testResult);
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error("Error running test", testCase.id, error);
        results.push({
          success: false,
          originalData: testCase.originalData,
          updateTranscript: testCase.updateTranscript,
          resultData: {} as StructuredHealthData,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          testCase
        });
      }
    }
    
    setTestHistory(results);
    setRunningBulkTest(false);
    setBulkTestProgress({ current: 0, total: 0 });
  };

  const generateTestReport = () => {
    if (testHistory.length === 0) return '';

    const timestamp = new Date().toISOString();
    const passedTests = testHistory.filter(t => t.success);
    const failedTests = testHistory.filter(t => !t.success);
    const testsWithJudge = testHistory.filter(t => t.judgeResult);
    const avgJudgeScore = testsWithJudge.length > 0 
      ? testsWithJudge.reduce((sum, t) => sum + (t.judgeResult?.score || 0), 0) / testsWithJudge.length 
      : 0;

    // Group by category
    const byCategory = testHistory.reduce((acc, test) => {
      if (!test.testCase) return acc;
      const cat = test.testCase.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(test);
      return acc;
    }, {} as Record<string, ValidationResult[]>);

    let report = `# AI Health Data Merge Validation Report

**Generated:** ${timestamp}
**Total Tests:** ${testHistory.length}
**Passed:** ${passedTests.length} (${Math.round((passedTests.length / testHistory.length) * 100)}%)
**Failed:** ${failedTests.length} (${Math.round((failedTests.length / testHistory.length) * 100)}%)
**AI Judge Average:** ${avgJudgeScore.toFixed(1)}/100

---

## Executive Summary

This report analyzes the accuracy of AI-powered health data merge operations using ${testHistory.length} test cases ranging from simple additions to complex edge cases. The system achieved a **${Math.round((passedTests.length / testHistory.length) * 100)}% pass rate** with an average AI judge score of **${avgJudgeScore.toFixed(1)}/100**.

## Performance by Category

`;

    // Category analysis
    Object.entries(byCategory).forEach(([category, tests]) => {
      const passed = tests.filter(t => t.success).length;
      const total = tests.length;
      const avgScore = tests.filter(t => t.judgeResult).reduce((sum, t) => sum + (t.judgeResult?.score || 0), 0) / tests.filter(t => t.judgeResult).length || 0;
      
      report += `### ${category.toUpperCase()} (${total} tests)
- **Pass Rate:** ${passed}/${total} (${Math.round((passed/total)*100)}%)
- **AI Judge Avg:** ${avgScore.toFixed(1)}/100
- **Notes:** ${getCategoryDescription(category)}

`;
    });

    report += `## Detailed Test Results

`;

    // Detailed results
    testHistory.forEach((test, index) => {
      const status = test.success ? '✅ PASS' : '❌ FAIL';
      const judgeScore = test.judgeResult ? ` (Judge: ${test.judgeResult.score}/100)` : '';
      
      report += `### Test ${index + 1}: ${test.testCase?.name || 'Custom Test'} ${status}${judgeScore}

**Category:** ${test.testCase?.category || 'custom'}
**Difficulty:** ${test.testCase?.difficulty || 'unknown'}
**Update:** "${test.updateTranscript}"

`;

      if (test.testCase) {
        report += `**Expected:** ${test.testCase.expectedBehavior}
`;
      }

      if (test.error) {
        report += `**Error:** ${test.error}
`;
      }

      if (test.judgeResult) {
        report += `**AI Judge Analysis:**
- Completeness: ${test.judgeResult.analysis.completeness}/100
- Accuracy: ${test.judgeResult.analysis.accuracy}/100  
- Preservation: ${test.judgeResult.analysis.preservation}/100
- Schema: ${test.judgeResult.analysis.schema}/100

`;

        if (test.judgeResult.issues.length > 0) {
          report += `**Issues Found:**
${test.judgeResult.issues.map(issue => `- ${issue}`).join('\n')}

`;
        }

        report += `**Judge Explanation:** ${test.judgeResult.explanation}

`;
      }

      report += `---

`;
    });

    // Recommendations
    report += `## Recommendations for Improvement

`;

    const failurePatterns = failedTests.map(t => t.testCase?.category).filter(Boolean);
    const lowScoreTests = testsWithJudge.filter(t => (t.judgeResult?.score || 0) < 80);

    if (failurePatterns.length > 0) {
      const categoryFailures = failurePatterns.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      report += `### Failure Analysis
The following categories show the most failures:
${Object.entries(categoryFailures).map(([cat, count]) => `- **${cat}**: ${count} failures`).join('\n')}

`;
    }

    if (lowScoreTests.length > 0) {
      report += `### Low-Scoring Tests (AI Judge < 80)
${lowScoreTests.map(t => `- ${t.testCase?.name}: ${t.judgeResult?.score}/100 - ${t.judgeResult?.explanation.substring(0, 100)}...`).join('\n')}

`;
    }

    report += `### Next Steps
1. **Focus on ${Object.keys(byCategory).find(cat => byCategory[cat].filter(t => !t.success).length > 0) || 'edge cases'}** - This category shows the most room for improvement
2. **Implement prompt improvements** from spec/improve-accuracy.md
3. **Add JSON schema validation** for more robust parsing
4. **Re-run this test suite** after each improvement to measure progress

---

**Report Generated by Claude Code AI Validation System**
**Test Suite Version:** 30 comprehensive test cases
**AI Judge Model:** Gemini 2.5 Pro
`;

    return report;
  };

  const getCategoryDescription = (category: string): string => {
    switch (category) {
      case 'additive': return 'Tests adding new information to existing data';
      case 'correction': return 'Tests correcting/updating existing values';
      case 'vague': return 'Tests with ambiguous or unclear language';
      case 'edge_case': return 'Tests with problematic inputs and edge cases';
      case 'complex': return 'Tests with multiple simultaneous changes';
      default: return 'Mixed test scenarios';
    }
  };

  const downloadReport = () => {
    const report = generateTestReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-validation-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyReportToClipboard = async () => {
    const report = generateTestReport();
    try {
      await navigator.clipboard.writeText(report);
      alert('Report copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: show in modal
      setShowReport(true);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => navigate({ to: '/debug' })}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="icon-[mdi-light--chevron-left] w-4 h-4 mr-2"></span>
              Back to Debug
            </button>
            <h1 className="text-lg font-semibold">Edit Validation Testing</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Test Setup */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Setup</h2>
          
          {/* Preset Tests */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Test Presets
            </label>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => loadPresetTest('additive')} className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200">
                Additive ("I also...")
              </button>
              <button onClick={() => loadPresetTest('correction')} className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm hover:bg-orange-200">
                Correction ("Actually...")
              </button>
              <button onClick={() => loadPresetTest('addition')} className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200">
                Addition (New meal)
              </button>
              <button onClick={() => loadPresetTest('complex')} className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm hover:bg-purple-200">
                Complex (Multiple changes)
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Original JSON */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Health Data (JSON)
              </label>
              <textarea
                value={originalJson}
                onChange={(e) => setOriginalJson(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="Enter original health data JSON..."
              />
            </div>

            {/* Update Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Text
              </label>
              <textarea
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-md"
                placeholder="Enter the update text that should be merged..."
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={runValidationTest}
              disabled={isLoading || runningBulkTest}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Running Test...' : 'Run Single Test'}
            </button>
            <button
              onClick={() => setShowTestSuite(!showTestSuite)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              {showTestSuite ? 'Hide' : 'Show'} Test Suite
            </button>
          </div>
        </div>

        {/* Test Suite */}
        {showTestSuite && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Suite ({testSuite.length} tests)</h2>
            
            {/* Bulk Test Controls */}
            <div className="mb-4 border-b pb-4">
              <h3 className="font-medium mb-2">Bulk Testing</h3>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => runBulkTests()}
                  disabled={runningBulkTest}
                  className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 disabled:bg-gray-400"
                >
                  Run All Tests
                </button>
                <button
                  onClick={() => runBulkTests('additive')}
                  disabled={runningBulkTest}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:bg-gray-400"
                >
                  Additive Only
                </button>
                <button
                  onClick={() => runBulkTests('correction')}
                  disabled={runningBulkTest}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 disabled:bg-gray-400"
                >
                  Corrections Only
                </button>
                <button
                  onClick={() => runBulkTests('vague')}
                  disabled={runningBulkTest}
                  className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 disabled:bg-gray-400"
                >
                  Vague Only
                </button>
                <button
                  onClick={() => runBulkTests('edge_case')}
                  disabled={runningBulkTest}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:bg-gray-400"
                >
                  Edge Cases
                </button>
              </div>
              {runningBulkTest && (
                <div className="text-sm text-gray-600">
                  Running bulk test: {bulkTestProgress.current}/{bulkTestProgress.total}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(bulkTestProgress.current / bulkTestProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Individual Test Cases */}
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {testSuite.map((testCase) => (
                <div key={testCase.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{testCase.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          testCase.category === 'additive' ? 'bg-blue-100 text-blue-800' :
                          testCase.category === 'correction' ? 'bg-orange-100 text-orange-800' :
                          testCase.category === 'vague' ? 'bg-yellow-100 text-yellow-800' :
                          testCase.category === 'edge_case' ? 'bg-red-100 text-red-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {testCase.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          testCase.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          testCase.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {testCase.difficulty}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 italic">
                        "{testCase.updateTranscript}"
                      </div>
                      {testCase.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {testCase.notes}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => loadTestCase(testCase)}
                      className="ml-3 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                    >
                      Load
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Result */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              Test Result
              <span className={`ml-3 px-2 py-1 rounded text-sm ${
                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.success ? 'SUCCESS' : 'FAILED'}
              </span>
              {result.judgeResult && (
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  result.judgeResult.passed ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  AI JUDGE: {result.judgeResult.score}/100 {result.judgeResult.passed ? '✓' : '✗'}
                </span>
              )}
            </h2>

            {result.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                <strong>Error:</strong> {result.error}
              </div>
            )}

            {result.success && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Merged Result:</h3>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-64">
                    {JSON.stringify(result.resultData, null, 2)}
                  </pre>
                </div>

                {/* AI Judge Results */}
                {result.judgeResult && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium text-gray-900 mb-3">AI Judge Evaluation (Gemini 2.5 Pro)</h3>
                    
                    {/* Score breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{result.judgeResult.analysis.completeness}</div>
                        <div className="text-xs text-gray-600">Completeness</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{result.judgeResult.analysis.accuracy}</div>
                        <div className="text-xs text-gray-600">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{result.judgeResult.analysis.preservation}</div>
                        <div className="text-xs text-gray-600">Preservation</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{result.judgeResult.analysis.schema}</div>
                        <div className="text-xs text-gray-600">Schema</div>
                      </div>
                    </div>

                    {/* Issues */}
                    {result.judgeResult.issues.length > 0 && (
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-700 mb-1">Issues Found:</h4>
                        <ul className="bg-yellow-50 p-2 rounded text-sm">
                          {result.judgeResult.issues.map((issue, idx) => (
                            <li key={idx} className="text-yellow-800">• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Explanation */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Judge Explanation:</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                        {result.judgeResult.explanation}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Visual Comparison */}
                <div className="grid md:grid-cols-2 gap-4 text-sm mt-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Changes Detected:</h4>
                    <div className="bg-blue-50 p-2 rounded">
                      {/* Simple change detection */}
                      {JSON.stringify(result.originalData) !== JSON.stringify(result.resultData) ? (
                        <span className="text-blue-800">Data was modified ✓</span>
                      ) : (
                        <span className="text-gray-600">No changes detected</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Update Text:</h4>
                    <div className="bg-gray-50 p-2 rounded italic">
                      "{result.updateTranscript}"
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              Test run at: {new Date(result.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Test History */}
        {testHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Test History ({testHistory.length} tests)
              </h2>
              {testHistory.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    Pass Rate: {Math.round((testHistory.filter(t => t.success).length / testHistory.length) * 100)}%
                    {testHistory.some(t => t.judgeResult) && (
                      <span className="ml-3">
                        AI Judge Avg: {Math.round(testHistory.filter(t => t.judgeResult).reduce((sum, t) => sum + (t.judgeResult?.score || 0), 0) / testHistory.filter(t => t.judgeResult).length)}/100
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyReportToClipboard}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      title="Copy report to clipboard"
                    >
                      📋 Copy Report
                    </button>
                    <button
                      onClick={downloadReport}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      title="Download report as markdown file"
                    >
                      💾 Download
                    </button>
                    <button
                      onClick={() => setShowReport(!showReport)}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                    >
                      👁️ Preview
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testHistory.map((test, index) => {
                const isExpanded = expandedHistoryItem === `${index}-${test.timestamp}`;
                const testKey = `${index}-${test.timestamp}`;
                
                return (
                  <div key={testKey} className="border border-gray-200 rounded">
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedHistoryItem(isExpanded ? null : testKey)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {test.testCase && (
                            <>
                              <span className="font-medium text-sm">{test.testCase.name}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                test.testCase.category === 'additive' ? 'bg-blue-100 text-blue-800' :
                                test.testCase.category === 'correction' ? 'bg-orange-100 text-orange-800' :
                                test.testCase.category === 'vague' ? 'bg-yellow-100 text-yellow-800' :
                                test.testCase.category === 'edge_case' ? 'bg-red-100 text-red-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {test.testCase.category}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">
                          "{test.updateTranscript.substring(0, 50)}{test.updateTranscript.length > 50 ? '...' : ''}"
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          test.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {test.success ? 'PASS' : 'FAIL'}
                        </span>
                        {test.judgeResult && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            test.judgeResult.passed ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            AI: {test.judgeResult.score}/100
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(test.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-gray-400">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4">
                        {/* Test Case Info */}
                        {test.testCase && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Test Case: {test.testCase.name}</h4>
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Expected:</strong> {test.testCase.expectedBehavior}
                            </div>
                            {test.testCase.notes && (
                              <div className="text-sm text-gray-500 mb-2">
                                <strong>Notes:</strong> {test.testCase.notes}
                              </div>
                            )}
                            <div className="text-sm">
                              <strong>Update:</strong> "{test.updateTranscript}"
                            </div>
                          </div>
                        )}
                        
                        {/* Error Display */}
                        {test.error && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                            <strong>Error:</strong> {test.error}
                          </div>
                        )}
                        
                        {/* AI Judge Results */}
                        {test.judgeResult && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">AI Judge Evaluation</h4>
                            
                            {/* Score breakdown */}
                            <div className="grid grid-cols-4 gap-4 mb-3">
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">{test.judgeResult.analysis.completeness}</div>
                                <div className="text-xs text-gray-600">Completeness</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-600">{test.judgeResult.analysis.accuracy}</div>
                                <div className="text-xs text-gray-600">Accuracy</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">{test.judgeResult.analysis.preservation}</div>
                                <div className="text-xs text-gray-600">Preservation</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-orange-600">{test.judgeResult.analysis.schema}</div>
                                <div className="text-xs text-gray-600">Schema</div>
                              </div>
                            </div>

                            {/* Issues */}
                            {test.judgeResult.issues.length > 0 && (
                              <div className="mb-3">
                                <h5 className="font-medium text-gray-700 mb-1">Issues Found:</h5>
                                <ul className="bg-yellow-50 p-2 rounded text-sm">
                                  {test.judgeResult.issues.map((issue, idx) => (
                                    <li key={idx} className="text-yellow-800">• {issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Explanation */}
                            <div>
                              <h5 className="font-medium text-gray-700 mb-1">Explanation:</h5>
                              <div className="bg-gray-100 p-2 rounded text-sm text-gray-700">
                                {test.judgeResult.explanation}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Result Data */}
                        {test.success && test.resultData && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Merged Result:</h4>
                            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(test.resultData, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Report Preview Modal */}
        {showReport && testHistory.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Test Report Preview</h3>
                <div className="flex gap-2">
                  <button
                    onClick={copyReportToClipboard}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={downloadReport}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    💾 Download
                  </button>
                  <button
                    onClick={() => setShowReport(false)}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto max-h-[80vh]">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border font-mono">
                  {generateTestReport()}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}