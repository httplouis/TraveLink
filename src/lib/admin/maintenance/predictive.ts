// src/lib/admin/maintenance/predictive.ts
/**
 * Predictive Maintenance Logic
 * Based on Philippines LTO requirements and maintenance best practices
 */

export interface MaintenanceSchedule {
  maintenance_type: string;
  document_type?: string;
  interval_days?: number;
  interval_km?: number;
  description: string;
}

export interface VehicleMaintenanceData {
  vehicle_id: string;
  last_service_date?: string;
  last_service_km?: number;
  current_odometer?: number;
  registration_date?: string;
  plate_number?: string;
  lto_renewal_month?: number; // 1-12, based on plate number
}

/**
 * Get maintenance schedule based on research document
 */
export function getMaintenanceSchedule(): MaintenanceSchedule[] {
  return [
    // Oil Changes
    {
      maintenance_type: 'oil_change',
      interval_days: 180, // ~6 months
      interval_km: 5000,
      description: 'Engine oil and filter change'
    },
    {
      maintenance_type: 'oil_change',
      interval_days: 90, // ~3 months for heavy use
      interval_km: 10000,
      description: 'Major oil change and full service'
    },
    
    // LTO Documents
    {
      maintenance_type: 'lto_renewal',
      document_type: 'CR_OR',
      interval_days: 365, // Annual
      description: 'LTO Registration Renewal (CR/OR)'
    },
    {
      maintenance_type: 'emission_test',
      document_type: 'CEC',
      interval_days: 365, // Annual
      description: 'Certificate of Emission Compliance'
    },
    {
      maintenance_type: 'mvir',
      document_type: 'MVIR',
      interval_days: 60, // 60-day validity
      description: 'Motor Vehicle Inspection Report'
    },
    {
      maintenance_type: 'insurance_renewal',
      document_type: 'Insurance_COC',
      interval_days: 365, // Annual
      description: 'Compulsory Third-Party Liability Insurance'
    },
    
    // LTFRB (for PUVs)
    {
      maintenance_type: 'ltfrb_renewal',
      document_type: 'LTFRB_CPC',
      interval_days: 365, // Annual
      description: 'LTFRB Certificate of Public Convenience Renewal'
    },
    
    // Preventive Maintenance
    {
      maintenance_type: 'pmo',
      interval_km: 1000,
      description: 'PM 1: Basic checks (oil, fluids, lights)'
    },
    {
      maintenance_type: 'pmo',
      interval_km: 5000,
      description: 'PM 2: Extensive servicing (filters, belts, brakes)'
    },
    {
      maintenance_type: 'pmo',
      interval_km: 10000,
      description: 'PM 3: Full inspection (timing belt, spark plugs)'
    },
    
    // Other Maintenance
    {
      maintenance_type: 'tire_change',
      interval_km: 50000, // Approximate
      description: 'Tire replacement'
    },
    {
      maintenance_type: 'brake_service',
      interval_km: 20000,
      description: 'Brake inspection and service'
    },
    {
      maintenance_type: 'filter_change',
      interval_km: 10000,
      description: 'Air filter and cabin filter replacement'
    },
    {
      maintenance_type: 'battery_replacement',
      interval_days: 730, // ~2 years
      description: 'Battery replacement'
    }
  ];
}

/**
 * Calculate next due date for maintenance based on type and vehicle data
 */
export function calculateNextDueDate(
  maintenanceType: string,
  vehicleData: VehicleMaintenanceData
): Date | null {
  const schedule = getMaintenanceSchedule().find(s => s.maintenance_type === maintenanceType);
  if (!schedule) return null;

  const now = new Date();
  let nextDue = new Date();

  // LTO Renewal: Based on plate number schedule
  if (maintenanceType === 'lto_renewal' && vehicleData.lto_renewal_month) {
    const renewalMonth = vehicleData.lto_renewal_month;
    nextDue = new Date(now.getFullYear(), renewalMonth - 1, 1);
    
    // If renewal month has passed this year, set for next year
    if (nextDue < now) {
      nextDue = new Date(now.getFullYear() + 1, renewalMonth - 1, 1);
    }
    return nextDue;
  }

  // Date-based maintenance
  if (schedule.interval_days) {
    const lastService = vehicleData.last_service_date 
      ? new Date(vehicleData.last_service_date)
      : (vehicleData.registration_date ? new Date(vehicleData.registration_date) : now);
    
    nextDue = new Date(lastService);
    nextDue.setDate(nextDue.getDate() + schedule.interval_days);
    
    // If due date has passed, set to today + interval
    if (nextDue < now) {
      nextDue = new Date(now);
      nextDue.setDate(nextDue.getDate() + schedule.interval_days);
    }
  }

  // Mileage-based maintenance
  if (schedule.interval_km && vehicleData.current_odometer && vehicleData.last_service_km) {
    const kmSinceService = vehicleData.current_odometer - (vehicleData.last_service_km || 0);
    const kmUntilDue = schedule.interval_km - kmSinceService;
    
    // Estimate days based on average daily mileage (assume 50km/day if not available)
    const avgDailyKm = 50;
    const daysUntilDue = Math.ceil(kmUntilDue / avgDailyKm);
    
    if (daysUntilDue > 0) {
      nextDue = new Date(now);
      nextDue.setDate(nextDue.getDate() + daysUntilDue);
    } else {
      // Already overdue
      nextDue = new Date(now);
    }
  }

  return nextDue;
}

/**
 * Generate predictive maintenance records for a vehicle
 */
export function generatePredictiveMaintenance(
  vehicleData: VehicleMaintenanceData
): Array<{
  maintenance_type: string;
  document_type?: string;
  due_date: Date;
  description: string;
  reminder_type: 'auto' | 'manual';
}> {
  const schedules = getMaintenanceSchedule();
  const records: Array<{
    maintenance_type: string;
    document_type?: string;
    due_date: Date;
    description: string;
    reminder_type: 'auto' | 'manual';
  }> = [];

  for (const schedule of schedules) {
    // Skip if vehicle doesn't need this type (e.g., LTFRB only for PUVs)
    if (schedule.maintenance_type === 'ltfrb_renewal') {
      // Only generate for PUVs - would need vehicle type check
      continue;
    }

    const dueDate = calculateNextDueDate(schedule.maintenance_type, vehicleData);
    if (dueDate) {
      records.push({
        maintenance_type: schedule.maintenance_type,
        document_type: schedule.document_type,
        due_date: dueDate,
        description: schedule.description,
        reminder_type: 'auto'
      });
    }
  }

  return records;
}

/**
 * Determine LTO renewal month from plate number
 * Philippines: Last digit of plate determines renewal month
 * 1-2: January, 3-4: February, 5-6: March, etc.
 */
export function getLtoRenewalMonth(plateNumber: string): number | null {
  // Extract last digit
  const lastDigit = parseInt(plateNumber.slice(-1));
  if (isNaN(lastDigit)) return null;

  // Map to month (1-12)
  if (lastDigit <= 2) return 1; // January
  if (lastDigit <= 4) return 2; // February
  if (lastDigit <= 6) return 3; // March
  if (lastDigit <= 8) return 4; // April
  return 5; // May (and others, but simplified)
}

/**
 * Check if maintenance is overdue
 */
export function isOverdue(dueDate: Date | string): boolean {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return due < new Date();
}

/**
 * Get days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate: Date | string): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

