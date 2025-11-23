# Institutional Vehicle Auto-Budget Proposal Rule

## Overview
When a user selects "Institutional vehicle" as their vehicle mode, the system automatically proposes a default budget to ensure all institutional vehicle requests have a budget for approval workflow.

## Rule Details

### When Applied
- **Trigger**: When `vehicleMode === "institutional"` is selected
- **Condition**: Only applies if no existing budget is present (all cost fields are 0 or empty)
- **Scope**: Applied throughout the system:
  - Frontend form (RequestWizard)
  - Store state management (requestStore)
  - API submission endpoints (`/api/requests/submit`, `/api/requests/smart-submit`)

### Proposed Budget Amounts
When institutional vehicle is selected and no budget exists, the system automatically sets:

```typescript
{
  food: 500,              // Default food budget (₱500)
  driversAllowance: 0,    // No driver allowance (driver provided by institution)
  rentVehicles: 0,        // No rental needed (using institutional vehicle)
  hiredDrivers: 0,        // No hired drivers needed (driver provided)
  accommodation: 0,       // Optional accommodation
  foodDescription: "Meals during travel"
}
```

### User Control
- **Editable**: All proposed amounts are fully editable by the user
- **Preservation**: If user already has budget amounts, they are preserved
- **Override**: User can change any amount, including setting to 0

## Implementation Locations

### 1. Frontend Components
- **File**: `src/components/user/request/RequestWizard.client.tsx`
- **Logic**: `useEffect` hook watches `vehicleMode` changes
- **Action**: Calls `mergeProposedBudget()` when institutional vehicle is selected

### 2. State Management
- **File**: `src/store/user/requestStore.tsx`
- **Logic**: `setVehicleMode` function includes budget proposal
- **Action**: Asynchronously proposes budget when mode changes to institutional

### 3. API Endpoints
- **Files**: 
  - `src/app/api/requests/submit/route.ts`
  - `src/app/api/requests/smart-submit/route.ts`
- **Logic**: Checks vehicle mode before processing costs
- **Action**: Auto-proposes budget if missing before validation/submission

### 4. Utility Functions
- **File**: `src/lib/user/request/budget-proposal.ts`
- **Functions**:
  - `getInstitutionalVehicleProposedBudget()`: Returns default budget structure
  - `hasExistingBudget(costs)`: Checks if any budget exists
  - `mergeProposedBudget(existingCosts)`: Merges proposed budget with existing costs

## Business Logic

### Why This Rule Exists
1. **Workflow Requirement**: Institutional vehicle requests typically require budget approval
2. **User Experience**: Pre-fills reasonable defaults to reduce form friction
3. **Data Consistency**: Ensures all institutional vehicle requests have budget data for reporting

### Budget Amount Rationale
- **Food (₱500)**: Standard meal allowance for travel
- **Driver Allowance (₱0)**: Not needed as driver is provided by institution
- **Vehicle Rental (₱0)**: Not needed as using institutional vehicle
- **Hired Drivers (₱0)**: Not needed as driver is provided
- **Accommodation (₱0)**: Optional, user can add if needed

## Testing Checklist

- [ ] Select institutional vehicle → Budget auto-proposes
- [ ] Change to owned vehicle → Budget remains (if already set)
- [ ] Change back to institutional → Budget re-proposes if cleared
- [ ] Edit proposed budget → Changes are preserved
- [ ] Submit with proposed budget → Submission succeeds
- [ ] Submit with edited budget → Submission succeeds
- [ ] API endpoint receives auto-proposed budget correctly

## Related Files
- `src/lib/user/request/budget-proposal.ts` - Core utility functions
- `src/components/user/request/ui/parts/CostsSection.view.tsx` - Budget input UI
- `src/lib/user/request/status.ts` - Budget calculation utilities

