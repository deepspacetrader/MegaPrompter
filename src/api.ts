// Simple API handler for serving prompts from localStorage
export interface PromptData {
  id: string;
  prompt: string;
  selections: Array<{ id: string; category: string; label: string }>;
  model: string;
  timestamp: string;
}

export const getPromptById = (id: string): PromptData | null => {
  try {
    const savedPrompt = localStorage.getItem(`prompt_${id}`);
    if (!savedPrompt) {
      return null;
    }
    
    const data = JSON.parse(savedPrompt);
    return {
      id,
      prompt: data.generatedResult?.prompt || '',
      selections: data.selections || [],
      model: data.selectedModel || '',
      timestamp: data.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to load prompt:', error);
    return null;
  }
};

// This function can be called from the browser console or via a simple fetch
export const createApiEndpoint = () => {
  // Override the fetch to handle our custom API routes
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    
    if (url.includes('/v1/prompt/')) {
      const id = url.split('/v1/prompt/')[1]?.split('?')[0];
      if (id) {
        const promptData = getPromptById(id);
        
        if (promptData) {
          return new Response(JSON.stringify(promptData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({ error: 'Prompt not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
    
    // Fall back to original fetch for all other requests
    return originalFetch(input, init);
  };
};
