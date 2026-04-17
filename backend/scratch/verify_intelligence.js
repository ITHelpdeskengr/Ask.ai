const { SYSTEM_PROMPT } = require('../config/systemPrompt');
const path = require('path');

async function verifyIntelligence() {
  console.log('--- SYSTEM PROMPT PREVIEW ---');
  console.log(SYSTEM_PROMPT.substring(0, 500) + '...');
  
  console.log('\n--- VERIFYING DIRECTIVES ---');
  const planTransparency = SYSTEM_PROMPT.includes('Plan of Action');
  const noFollowUp = SYSTEM_PROMPT.includes('ZERO FOLLOW-UP QUESTIONS');
  const readAll = SYSTEM_PROMPT.includes('read ALL relevant documents');
  const webFallback = SYSTEM_PROMPT.includes('search_the_web');

  console.log(`Plan Transparency Directive: ${planTransparency ? '✅' : '❌'}`);
  console.log(`Zero Follow-up Directive: ${noFollowUp ? '✅' : '❌'}`);
  console.log(`Read All KB Files Directive: ${readAll ? '✅' : '❌'}`);
  console.log(`Web Fallback Directive: ${webFallback ? '✅' : '❌'}`);

  if (planTransparency && noFollowUp && readAll && webFallback) {
    console.log('\n✨ Intelligence and Autonomy directives are correctly implemented.');
  } else {
    console.log('\n⚠️ Some directives are missing.');
  }
}

verifyIntelligence();
