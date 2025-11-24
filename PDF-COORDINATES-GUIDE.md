# PDF Coordinates Manual Adjustment Guide

## Quick Start

### 1. Fast Debug Grid (Recommended for Manual Adjustment)

Instead of waiting for the full PDF to download, use the **"Debug Grid"** button in the modal:

1. Open any request modal (Tracking Modal, Request Details, etc.)
2. Click the **"Debug Grid"** button (blue button next to "Download PDF")
3. This generates a **fast PDF with coordinate grid** showing:
   - Grid lines every 50 points
   - Red crosshairs marking current coordinate positions
   - Labels showing exact (x, top) coordinates
   - Sample text at key positions

### 2. Adjust Coordinates

Edit the file: `src/lib/utils/pdf-coordinates-helper.ts`

All coordinates are organized by section:
- `REQUESTING_PERSON` - Requesting person names and signatures
- `DEPARTMENT` - Department field
- `DESTINATION`, `DEPARTURE_DATE`, `RETURN_DATE`, `PURPOSE` - Travel details
- `COST_START_Y` - Starting Y position for cost breakdown
- `APPROVALS` - All approval signatures (Head, Comptroller, HR, VP, President, etc.)
- `DRIVER`, `VEHICLE` - School service section

### 3. Coordinate System

- **Origin**: Top-left corner (0, 0)
- **X**: Horizontal position from left edge
- **Top**: Vertical position from top edge
- **Page Size**: A4 = 595.28 x 841.89 points

**Note**: PDF-lib uses bottom-left as origin, but we use top-based coordinates for easier adjustment.

### 4. Example: Adjusting Head Signature Position

```typescript
// In pdf-coordinates-helper.ts
APPROVALS: {
  HEAD: {
    sig: { x: 85, top: 380, w: 200, h: 40 },  // Signature box
    name: { x: 85, top: 425, w: 200, h: 12 }, // Name below signature
  },
}
```

To move the signature **10 points to the right** and **5 points down**:
```typescript
sig: { x: 95, top: 385, w: 200, h: 40 },  // x: 85+10, top: 380+5
```

### 5. Using the Helper Functions

```typescript
import { PDF_COORDINATES, adjustCoords } from '@/lib/utils/pdf-coordinates-helper';

// Get base coordinates
const headSig = PDF_COORDINATES.APPROVALS.HEAD.sig;

// Adjust with offsets
const adjusted = adjustCoords(headSig, { x: 10, y: -5 }); // Move right 10, up 5
```

### 6. Testing Your Changes

1. Edit coordinates in `pdf-coordinates-helper.ts`
2. Click **"Debug Grid"** button to see new positions
3. Click **"Download PDF"** to see actual PDF with your changes
4. Repeat until positions are correct

### 7. Common Adjustments

**Move signature left/right**: Change `x` value
**Move signature up/down**: Change `top` value
**Make signature bigger**: Increase `w` and `h` values
**Move name closer to signature**: Decrease `top` value (name is below signature)

### 8. Current Coordinate Reference

See `src/lib/utils/pdf-coordinates-helper.ts` for all current coordinates.

Key positions:
- Requesting Person: x=150, top=180
- Head Signature: x=85, top=380
- Comptroller Signature: x=480, top=570
- HR Signature: x=85, top=630
- VP Signature: x=85, top=730
- President Signature: x=85, top=530

### 9. Tips

- Use the debug grid to find exact positions visually
- Make small adjustments (5-10 points at a time)
- Test frequently with the debug grid (it's fast!)
- Keep signature boxes proportional (w:h ratio ~5:1)
- Names should be 35-45 points below signature boxes

### 10. Need Help?

- Check the debug grid PDF for visual reference
- All coordinates are in `pdf-coordinates-helper.ts`
- The main PDF generation code is in `src/app/api/requests/[id]/pdf/route.ts`

