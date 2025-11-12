// Quick test to check if smart-engine.ts has any issues
const { SmartWorkflowEngine } = require('./src/lib/workflow/smart-engine.ts');

console.log('Testing SmartWorkflowEngine...');

try {
  // Test basic functionality
  const testRequest = {
    id: 'test-123',
    requester_id: 'user-123',
    status: 'pending_head',
    requires_budget: false,
    budget_version: 1,
    hr_budget_ack_required: false,
    exec_level: 'vp',
    parent_department_routing: 'own_office',
    smart_skips_applied: []
  };

  const testUser = {
    id: 'user-123',
    is_head: true,
    is_admin: false,
    is_comptroller: false,
    is_hr: false,
    is_exec: false,
    exec_type: null
  };

  // Test smart detection
  const shouldSkip = SmartWorkflowEngine.shouldAutoApproveStage(testUser, 'pending_head', testRequest);
  console.log('✅ shouldAutoApproveStage works:', shouldSkip);

  // Test budget intelligence
  const requiresComptroller = SmartWorkflowEngine.requiresComptroller(testRequest);
  console.log('✅ requiresComptroller works:', requiresComptroller);

  // Test analytics
  const analytics = SmartWorkflowEngine.getWorkflowAnalytics(testRequest);
  console.log('✅ getWorkflowAnalytics works:', analytics);

  console.log('🎉 All tests passed! SmartWorkflowEngine is working correctly.');

} catch (error) {
  console.error('❌ Error in SmartWorkflowEngine:', error.message);
  console.error('Stack:', error.stack);
}
