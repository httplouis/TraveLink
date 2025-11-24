/**
 * PDF Coordinates Helper
 * 
 * This file contains all the coordinate mappings for the Travel Order PDF template.
 * Adjust these values to fine-tune the positioning of elements.
 * 
 * Coordinates are measured from the top-left corner of the page (0,0 at top-left).
 * Note: PDF-lib uses bottom-left as origin, so we convert: y = PAGE_H - top
 */

export const PDF_COORDINATES = {
  // Page dimensions (A4)
  PAGE_WIDTH: 595.28,  // A4 width in points
  PAGE_HEIGHT: 841.89, // A4 height in points
  
  // Header section
  CREATED_DATE: { x: 100, top: 123, w: 150, h: 14 },
  
  // Requesting Person section
  REQUESTING_PERSON: {
    startX: 151,
    startY: 185,
    nameWidth: 180,
    sigWidth: 120, // Increased signature width for better visibility (was 80)
    sigHeight: 45, // Increased signature height for better visibility (was 30)
    colSpacing: 280,
    rowSpacing: 15, // Reduced spacing for vertical list (was 50)
    // Individual element positions (relative to startX, startY for each requester)
    name: { offsetX: 0, offsetY: 0, w: 180, h: 10 }, // Name position
    signature: { offsetX: 45, offsetY: -18, w: 120, h: 45 }, // Default signature position BESIDE name
    // Individual requester signature positions (by index: 0 = first requester, 1 = second, etc.)
    // Override default signature position for specific requesters
    requesterSignatures: [
      // First requester (index 0) - Jose Louis
      { offsetX: 50, offsetY: -10, w: 120, h: 45 },
      // Second requester (index 1) - Belson
      { offsetX: 45, offsetY: -18, w: 120, h: 45 },
      // Add more as needed (index 2, 3, etc.)
    ],
    // dateTime removed - no longer displaying date/time
  },
  
  // Department
  DEPARTMENT: { x: 449, top: 169, w: 146, h: 42 },
  
  // Travel details
  DESTINATION: { x: 150, top: 210, w: 446, h: 32 },
  DEPARTURE_DATE: { x: 150, top: 240, w: 210, h: 14 },
  RETURN_DATE: { x: 450, top: 235, w: 150, h: 14 },
  PURPOSE: { x: 150, top: 260, w: 446, h: 26 },
  
  // Travel Cost section
  COST_START_Y: 287,
  COST_ITEM_SPACING: 8,
  COST_MAX_ITEMS: 12,
  
  // Approval sections
  APPROVALS: {
    // Head endorsement (Indorsed by)
    HEAD: {
      sig: { x: 60, top: 375, w: 260, h: 60 }, // Increased for better visibility (was 240x50)
      name: { x: 130, top: 400, w: 200, h: 12 },
      date: { x: 150, top: 370, w: 120, h: 12 }, // Date on the right side
      comments: { x: 150, top: 380, w: 200, h: 20 }, // Comments below name
    },
    
    // Parent Head (if exists)
    PARENT_HEAD: {
      sig: { x: 85, top: 340, w: 260, h: 60 }, // Increased for better visibility (was 240x50)
      name: { x: 85, top: 385, w: 200, h: 12 },
      date: { x: 350, top: 350, w: 120, h: 12 }, // Date on the right side
      comments: { x: 85, top: 400, w: 200, h: 20 }, // Comments below name
    },
    
    // Comptroller (For Travel Cost - Recommending Approval)
    COMPTROLLER: {
      sig: { x: 330, top: 380, w: 220, h: 60 }, // Increased for better visibility (was 180x50)
      name: { x: 415, top: 400, w: 180, h: 12 }, // Name below signature
      date: { x: 520, top: 380, w: 100, h: 12 }, // Date on the right side
      comments: { x: 520, top: 400, w: 250, h: 20 }, // Comments below name (fixed position)
      recAmount: { x: 480, top: 620, w: 200, h: 12 },
      account: { x: 480, top: 608, w: 200, h: 12 },
    },
    
    // HR Director (Noted by)
    HR: {
      sig: { x: 105, top: 530, w: 260, h: 60 }, // Increased for better visibility (was 240x50)
      name: { x: 145, top: 570, w: 200, h: 12 },
      date: { x: 420, top: 560, w: 120, h: 12 }, // Date on the right side
      comments: { x: 240, top: 560, w: 200, h: 20 }, // Comments below name
    },
    
    // VP (Recommending Approval)
    VP: {
      sig: { x: 95, top: 600, w: 260, h: 60 }, // Increased for better visibility (was 240x50)
      name: { x: 155, top: 630, w: 200, h: 12 },
      date: { x: 420, top: 625, w: 120, h: 12 }, // Date on the right side
      comments: { x: 230, top: 630, w: 200, h: 20 }, // Comments below name
    },
    
    // VP2 (if both VPs approved)
    VP2: {
      sig: { x: 85, top: 680, w: 260, h: 60 }, // Increased for better visibility (was 240x50)
      name: { x: 85, top: 725, w: 200, h: 12 },
      date: { x: 420, top: 690, w: 120, h: 12 }, // Date on the right side
      comments: { x: 85, top: 740, w: 200, h: 20 }, // Comments below name
    },
    
    // President/COO (Approved by)
    PRESIDENT: {
      sig: { x: 105, top: 660, w: 260, h: 60 }, // Increased for better visibility (was 240x50)
      name: { x: 145, top: 690, w: 200, h: 12 },
      date: { x: 420, top: 680, w: 120, h: 12 }, // Date on the right side
      comments: { x: 250, top: 835, w: 200, h: 20 }, // Comments below name
    },

    // Transportation Coordinator (School Service Request)
    TRANSPORT_COORD: {
      sig: { x: 320, top: 430, w: 260, h: 60 }, // Increased for better visibility (was 240x50)
      name: { x: 415, top: 470, w: 200, h: 12 },
      date: { x: 480, top: 450, w: 100, h: 12 }, // Date on the right side
      comments: { x: 510, top: 470, w: 200, h: 20 }, // Comments below name
    },
  },
  
  // School Service section
  DRIVER: { x: 110, top: 470, w: 210, h: 14 },
  VEHICLE: { x: 110, top: 485, w: 210, h: 14 },
};

/**
 * Helper function to convert top-based coordinates to PDF-lib's bottom-based coordinates
 */
export function convertToPDFCoords(top: number, pageHeight: number): number {
  return pageHeight - top;
}

/**
 * Helper function to adjust coordinates with offsets
 */
export function adjustCoords(
  base: { x: number; top: number; w?: number; h?: number },
  offsets: { x?: number; y?: number; w?: number; h?: number }
): { x: number; top: number; w: number; h: number } {
  return {
    x: base.x + (offsets.x || 0),
    top: base.top + (offsets.y || 0),
    w: (base.w || 0) + (offsets.w || 0),
    h: (base.h || 0) + (offsets.h || 0),
  };
}

/**
 * Print all coordinates for debugging
 */
export function printCoordinates() {
  console.log('=== PDF COORDINATES ===');
  console.log(JSON.stringify(PDF_COORDINATES, null, 2));
}

