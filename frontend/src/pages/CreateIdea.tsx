import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Create Idea Page
 * 
 * Triggers the Mastra Create Idea Workflow which:
 * 1. Creates GitHub repository
 * 2. Sets up all waterfall branches
 * 3. Initializes requirements documentation
 * 4. Returns idea ID for navigation
 */

interface CreateIdeaFormData {
  name: string;
  description: string;
}

interface CreateIdeaResponse {
  success: boolean;
  idea?: {
    id: string;
    name: string;
    description: string;
    repoName: string;
    repoUrl: string;
    currentStage: string;
    branches: string[];
  };
  message?: string;
  error?: string;
}

export function CreateIdea() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateIdeaFormData>({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<{
    step: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<CreateIdeaResponse | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear errors when user types
    if (error) setError('');
  };

  const simulateWorkflowProgress = () => {
    const steps = [
      { step: 'validate', message: 'Validating idea name and description...' },
      { step: 'create-repo', message: 'Creating GitHub repository...' },
      { step: 'create-branches', message: 'Setting up waterfall branches...' },
      { step: 'initialize-docs', message: 'Initializing requirements documentation...' },
      { step: 'complete', message: 'Idea created successfully!' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setWorkflowStatus(steps[currentStep]);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 1500);

    return interval;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Idea name is required');
      return;
    }
    
    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess(null);
    
    // Start workflow progress simulation
    const progressInterval = simulateWorkflowProgress();

    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth token
          // 'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(formData)
      });

      const data: CreateIdeaResponse = await response.json();

      clearInterval(progressInterval);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create idea');
      }

      setSuccess(data);
      setWorkflowStatus({ step: 'complete', message: 'Idea created successfully!' });

      // Navigate to idea dashboard after short delay
      setTimeout(() => {
        if (data.idea?.id) {
          navigate(`/ideas/${data.idea.id}`);
        }
      }, 2000);

    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'Failed to create idea. Please try again.');
      setWorkflowStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="text-4xl font-bold text-gray-900">Create New Idea</h1>
          <p className="text-gray-600 mt-2 text-lg">
            Start building your startup systematically with AI guidance through the Possible Futures methodology.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Idea Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                    Idea Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                    placeholder="e.g., AI-Powered Scheduling App"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.name.length}/100 characters • This will be your project name
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all min-h-[150px]"
                    placeholder="Describe your startup idea, the problem you're solving, and who you're helping..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.description.length}/500 characters • Be specific about the problem and solution
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-900">Error</h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-green-900">Success!</h3>
                        <p className="text-sm text-green-700 mt-1">{success.message}</p>
                        {success.idea && (
                          <div className="mt-3 space-y-1 text-xs text-green-700">
                            <p>• Repository: <strong>{success.idea.repoName}</strong></p>
                            <p>• Branches: {success.idea.branches.join(', ')}</p>
                            <p>• Current Stage: <strong>{success.idea.currentStage}</strong></p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Workflow Progress */}
                {workflowStatus && isSubmitting && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 text-blue-500 mr-3 animate-spin" />
                      <div>
                        <h3 className="text-sm font-semibold text-blue-900">Creating Idea...</h3>
                        <p className="text-sm text-blue-700 mt-1">{workflowStatus.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    disabled={isSubmitting}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.name.trim() || formData.description.trim().length < 10}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Idea'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - What Happens Next */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-primary-50 to-white rounded-lg border border-primary-100 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold">
                    1
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">GitHub Repository</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      We'll create a private GitHub repository for your idea with all waterfall branches
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold">
                    2
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Waterfall Branches</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      6 branches will be created: requirements, analysis, design, implementation, testing, validation
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold">
                    3
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Initial Documentation</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      REQUIREMENTS.md, ASSUMPTIONS.md, and GOALS.md will be initialized in the requirements branch
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold">
                    4
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">AI Guidance</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Your AI cofounder will guide you through each stage with structured workflows
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold">
                    5
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Start Building</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Begin with the Requirements phase to define your problem, users, and success criteria
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-primary-100">
                <p className="text-xs text-gray-600">
                  <strong className="text-gray-900">Pro tip:</strong> The more detailed your description, the better AI recommendations you'll receive!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
