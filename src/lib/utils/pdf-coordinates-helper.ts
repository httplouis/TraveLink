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
    startX: 150,
    startY: 180,
    nameWidth: 180,
    sigWidth: 100,
    sigHeight: 35,
    colSpacing: 280,
    rowSpacing: 50,
  },
  
  // Department
  DEPARTMENT: { x: 449, top: 169, w: 146, h: 42 },
  
  // Travel details
  DESTINATION: { x: 150, top: 210, w: 446, h: 32 },
  DEPARTURE_DATE: { x: 150, top: 240, w: 210, h: 14 },
  RETURN_DATE: { x: 450, top: 235, w: 150, h: 14 },
  PURPOSE: { x: 150, top: 260, w: 446, h: 26 },
  
  // Travel Cost section
  COST_START_Y: 295,
  COST_ITEM_SPACING: 10,
  COST_MAX_ITEMS: 12,
  
  // Approval sections
  APPROVALS: {
    // Head endorsement (Indorsed by)
    HEAD: {
      sig: { x: 85, top: 380, w: 200, h: 40 },
      name: { x: 85, top: 400, w: 200, h: 12 },
      date: { x: 150, top: 370, w: 120, h: 12 }, // Date on the right side
      comments: { x: 150, top: 380, w: 200, h: 20 }, // Comments below name
    },
    
    // Parent Head (if exists)
    PARENT_HEAD: {
      sig: { x: 85, top: 340, w: 200, h: 40 },
      name: { x: 85, top: 385, w: 200, h: 12 },
      date: { x: 350, top: 350, w: 120, h: 12 }, // Date on the right side
      comments: { x: 85, top: 400, w: 200, h: 20 }, // Comments below name
    },
    
    // Comptroller (For Travel Cost - Recommending Approval)
    COMPTROLLER: {
      sig: { x: 380, top: 380, w: 180, h: 40 },
      name: { x: 380, top: 400, w: 180, h: 12 },
      date: { x: 480, top: 380, w: 100, h: 12 }, // Date on the right side
      comments: { x: 480, top: 390, w: 180, h: 20 }, // Comments below name
      recAmount: { x: 480, top: 620, w: 200, h: 12 },
      account: { x: 480, top: 608, w: 200, h: 12 },
    },
    
    // HR Director (Noted by)
    HR: {
      sig: { x: 85, top: 565, w: 200, h: 40 },
      name: { x: 85, top: 575, w: 200, h: 12 },
      date: { x: 400, top: 575, w: 120, h: 12 }, // Date on the right side
      comments: { x: 85, top: 590, w: 200, h: 20 }, // Comments below name
    },
    
    // VP (Recommending Approval)
    VP: {
      sig: { x: 85, top: 640, w: 200, h: 40 },
      name: { x: 85, top: 620, w: 200, h: 12 },
      date: { x: 400, top: 625, w: 120, h: 12 }, // Date on the right side
      comments: { x: 85, top: 635, w: 200, h: 20 }, // Comments below name
    },
    
    // VP2 (if both VPs approved)
    VP2: {
      sig: { x: 85, top: 680, w: 200, h: 40 },
      name: { x: 85, top: 725, w: 200, h: 12 },
      date: { x: 380, top: 690, w: 120, h: 12 }, // Date on the right side
      comments: { x: 85, top: 740, w: 200, h: 20 }, // Comments below name
    },
    
    // President/COO (Approved by)
    PRESIDENT: {
      sig: { x: 85, top: 675, w: 200, h: 40 },
      name: { x: 85, top: 690, w: 200, h: 12 },
      date: { x: 400, top: 680, w: 120, h: 12 }, // Date on the right side
      comments: { x: 85, top: 705, w: 200, h: 20 }, // Comments below name
    },
    
    // Transportation Coordinator (School Service Request)
    TRANSPORT_COORD: {
      sig: { x: 380, top: 445, w: 200, h: 40 },
      name: { x: 380, top: 465, w: 200, h: 12 },
      date: { x: 480, top: 460, w: 100, h: 12 }, // Date on the right side
      comments: { x: 480, top: 470, w: 200, h: 20 }, // Comments below name
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

