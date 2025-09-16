import DashboardView from "@/components/driver/dashboard/DashboardView";

export default function Page() {
  // metrics
  const metrics = { trips: 4, online: 2, pending: 2 };

  // upcoming list
  const upcoming = [
    { id: "u1", date: "2025-12-25 08:00", location: "Tagaytay",     vehicle: "Bus", status: "Approved" as const },
    { id: "u2", date: "2025-12-28 09:30", location: "MSEUF Lucena", vehicle: "Van", status: "Pending"  as const },
  ];

  // actions (no maintenance)
  const actions = [
    { icon: null, title: "Upcoming Schedules", desc: "Preview your next trips with dates, time, and locations.", href: "/driver/schedule" },
    { icon: null, title: "Trip History",       desc: "Review completed trips and past assignments.",             href: "/driver/history" },
  ];

  // ✅ Fleet data with logs so the View Logs button is enabled
  const fleet = [
    {
      id: "v1",
      name: "Bus 12",
      plate: "ABC-1234",
      type: "Bus",
      status: "available" as const,
      lastMaintenance: "2025-08-22",
      nextDue: "2025-10-22",
      logs: [
        {
          id: "M-2025-081",
          date: "2025-08-22",
          category: "Oil Change",
          odometer: 45210,
          description: "Replaced engine oil and filter.",
          nextDueDate: "2025-10-22",
        },
        {
          id: "M-2025-056",
          date: "2025-06-10",
          category: "Brake Service",
          description: "Front pads replaced; rotor resurfaced.",
        },
      ],
    },
    {
      id: "v2",
      name: "Van 03",
      plate: "XYZ-9087",
      type: "Van",
      status: "assigned" as const,
      lastMaintenance: "2025-07-30",
      nextDue: "2025-11-30",
      logs: [
        {
          id: "M-2025-073",
          date: "2025-07-30",
          category: "Tire Rotation",
          description: "Rotated all four tires; checked pressure.",
        },
      ],
    },
  ];

  return (
    <DashboardView
      metrics={metrics}
      upcoming={upcoming}
      actions={actions}
      fleet={fleet}
    />
  );
}
