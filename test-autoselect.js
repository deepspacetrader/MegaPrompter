// Test script for AI-powered tech stack selection
const testAutoSelect = async () => {
  try {
    console.log('Testing AI-powered tech stack selection...');
    
    const response = await fetch('http://localhost:3001/api/auto-select-stack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        selections: [
          { id: 'web', category: 'Platform', label: 'Web Application' },
          { id: 'saas_mvp', category: 'Core Purpose', label: 'Build a commercial SaaS MVP' }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const recommendations = await response.json();
    
    console.log('✅ AI Tech Stack Recommendations:');
    console.log(JSON.stringify(recommendations, null, 2));
    console.log(`\n📊 Received ${recommendations.length} recommendations`);
    
    return recommendations;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
};

// Run the test
testAutoSelect();
