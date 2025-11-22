# VP & President Portal Implementation Guide

**Purpose:** Step-by-step guide to build executive portals  
**Estimated Time:** 12-16 hours total  
**Difficulty:** Medium

---

## 📁 **DIRECTORY STRUCTURE TO CREATE:**

```
src/app/(protected)/
├── vp/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── inbox/
│   │   └── page.tsx
│   ├── history/
│   │   └── page.tsx
│   ├── analytics/
│   │   └── page.tsx
│   └── layout.tsx
│
└── president/
    ├── dashboard/
    │   └── page.tsx
    ├── inbox/
    │   └── page.tsx
    ├── history/
    │   └── page.tsx
    ├── analytics/
    │   └── page.tsx
    ├── policy/
    │   └── page.tsx
    └── layout.tsx

src/components/
├── vp/
│   ├── VPDashboard.tsx
│   ├── VPInbox.tsx
│   ├── BudgetOverview.tsx
│   ├── DepartmentMetrics.tsx
│   └── nav/
│       └── VPLeftNav.tsx
│
└── president/
    ├── PresidentDashboard.tsx
    ├── PresidentInbox.tsx
    ├── TravelAnalytics.tsx
    ├── PolicyManager.tsx
    └── nav/
        └── PresidentLeftNav.tsx

src/app/api/
├── vp/
│   ├── inbox/
│   │   └── route.ts
│   ├── analytics/
│   │   └── route.ts
│   └── approve/
│       └── [id]/
│           └── route.ts
│
└── president/
    ├── inbox/
    │   └── route.ts
    ├── analytics/
    │   └── route.ts
    ├── policy/
    │   └── route.ts
    └── approve/
        └── [id]/
            └── route.ts
```

---

## 🏗️ **STEP 1: VP PORTAL (6-8 hours)**

### 1.1 Create VP Layout

**File:** `src/app/(protected)/vp/layout.tsx`

```typescript
import VPLeftNav from "@/components/vp/nav/VPLeftNav";

export default function VPLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-[#7a0019]">VP Portal</h1>
          <p className="text-sm text-gray-600">Vice President Dashboard</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <VPLeftNav />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
```

---

### 1.2 Create VP Navigation

**File:** `src/components/vp/nav/VPLeftNav.tsx`

```typescript
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Inbox, 
  History, 
  BarChart3,
  PlusSquare,
  FileClock,
  ListChecks,
  UserRound,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";

type NavLink = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const NAV: NavLink[] = [
  { href: "/vp/dashboard", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/vp/inbox", label: "Executive Review", Icon: Inbox },
  { href: "/vp/history", label: "Review History", Icon: History },
  { href: "/vp/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/vp/profile", label: "Profile", Icon: UserRound },
  { href: "/vp/settings", label: "Settings", Icon: Settings },
];

export default function VPLeftNav() {
  const pathname = usePathname() ?? "";
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const navRefs = React.useRef<Record<string, HTMLAnchorElement | null>>({});
  const containerRef = React.useRef<HTMLElement | null>(null);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav 
      ref={containerRef}
      className="space-y-1.5 relative"
      onMouseLeave={() => setHoveredItem(null)}
    >
      {/* Active background with animation */}
      {(() => {
        const activeHref = NAV.find(item => isActive(item.href, item.exact))?.href;
        if (!activeHref || !navRefs.current[activeHref] || !containerRef.current) return null;
        
        const activeItem = navRefs.current[activeHref];
        const container = containerRef.current;
        const itemRect = activeItem.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const top = itemRect.top - containerRect.top + container.scrollTop;
        const left = itemRect.left - containerRect.left;
        
        return (
          <motion.div
            className="absolute pointer-events-none rounded-xl shadow-md bg-[#7a0019]"
            initial={false}
            animate={{
              top: `${top}px`,
              left: `${left}px`,
              width: `${itemRect.width}px`,
              height: `${itemRect.height}px`,
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 180, 
              damping: 25,
              mass: 1.2
            }}
          />
        );
      })()}

      {NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        
        return (
          <Link
            key={item.href}
            ref={(el) => { navRefs.current[item.href] = el; }}
            href={item.href}
            onMouseEnter={() => setHoveredItem(item.href)}
            className={[
              "group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
              active ? "text-white" : "text-slate-700 hover:text-white",
            ].join(" ")}
          >
            <item.Icon className="h-5 w-5 group-hover:text-white" />
            <span className="flex-1 group-hover:text-white">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

---

### 1.3 Create VP Dashboard

**File:** `src/app/(protected)/vp/dashboard/page.tsx`

```typescript
"use client";

import React from "react";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  Users
} from "lucide-react";

export default function VPDashboard() {
  const [stats, setStats] = React.useState({
    pending: 0,
    approved_today: 0,
    total_budget: 0,
    avg_approval_time: "0h",
  });

  React.useEffect(() => {
    // Fetch stats from API
    fetch("/api/vp/analytics")
      .then(res => res.json())
      .then(data => {
        if (data.ok) setStats(data.stats);
      });
  }, []);

  const cards = [
    {
      title: "Pending Review",
      value: stats.pending,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-700",
      iconBg: "bg-yellow-100",
    },
    {
      title: "Approved Today",
      value: stats.approved_today,
      icon: CheckCircle,
      color: "bg-green-50 text-green-700",
      iconBg: "bg-green-100",
    },
    {
      title: "Total Budget (Month)",
      value: `₱${stats.total_budget.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-blue-50 text-blue-700",
      iconBg: "bg-blue-100",
    },
    {
      title: "Avg Approval Time",
      value: stats.avg_approval_time,
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-700",
      iconBg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">VP Dashboard</h1>
        <p className="text-gray-600 mt-1">Executive overview and pending approvals</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`${card.color} rounded-xl p-6 border border-gray-200`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.iconBg} p-3 rounded-lg`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm font-medium opacity-80">{card.title}</p>
            <p className="text-3xl font-bold mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-500">Recent approvals and activities will appear here</p>
      </div>
    </div>
  );
}
```

---

### 1.4 Create VP Inbox

**File:** `src/app/(protected)/vp/inbox/page.tsx`

```typescript
"use client";

import React from "react";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";

export default function VPInbox() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/vp/inbox")
      .then(res => res.json())
      .then(data => {
        if (data.ok) setItems(data.data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-[#7a0019] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Executive Review</h1>
        <p className="text-gray-600 mt-1">
          {items.length} {items.length === 1 ? 'request' : 'requests'} requiring VP approval
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-[#7A0010]/30 hover:shadow-lg cursor-pointer"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="rounded-md bg-[#7A0010] px-2.5 py-0.5 text-xs font-bold text-white">
                  {item.request_number}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {new Date(item.travel_start_date).toLocaleDateString()}
                </span>
              </div>

              <PersonDisplay
                name={item.requester_name}
                position={item.requester?.position_title}
                department={item.department?.name}
                profilePicture={item.requester?.profile_picture}
                size="sm"
              />

              <p className="text-sm text-slate-600 line-clamp-1 mt-2">
                {item.purpose}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 ml-4">
              <StatusBadge status="pending_exec" size="md" showIcon={true} />
              <span className="text-sm font-semibold text-[#7a0019]">
                ₱{item.total_budget?.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🏗️ **STEP 2: PRESIDENT PORTAL (6-8 hours)**

### 2.1 Follow Same Structure as VP

The President portal follows the same structure but with additional features:

**Additional Pages:**
- `/president/policy` - Policy management
- `/president/override` - Override capabilities
- `/president/strategic` - Strategic planning

**Additional Components:**
- `PolicyManager.tsx` - Create/edit policies
- `OverrideControl.tsx` - Override any decision
- `StrategicDashboard.tsx` - University-wide view

**Key Differences:**
- President sees ALL requests (VP + President level)
- Can override any approval
- Can create system-wide policies
- Has complete visibility

---

## 🔌 **STEP 3: API ENDPOINTS**

### 3.1 VP Inbox API

**File:** `src/app/api/vp/inbox/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.is_vp) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  // Get requests requiring VP approval
  const requests = await db.query(`
    SELECT 
      r.*,
      u.name as requester_name,
      u.profile_picture as requester_picture,
      u.position_title as requester_position,
      d.name as department_name
    FROM requests r
    LEFT JOIN users u ON r.requester_id = u.id
    LEFT JOIN departments d ON r.department_id = d.id
    WHERE r.status = 'pending_exec'
      AND (r.exec_level = 'vp' OR r.exec_level IS NULL)
      AND r.exec_signature IS NULL
    ORDER BY r.created_at DESC
  `);

  return NextResponse.json({
    ok: true,
    data: requests.rows,
  });
}
```

---

### 3.2 VP Analytics API

**File:** `src/app/api/vp/analytics/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.is_vp) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  // Get VP-specific analytics
  const stats = await db.query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'pending_exec' AND exec_level = 'vp') as pending,
      COUNT(*) FILTER (
        WHERE exec_approved_by = $1 
        AND exec_approved_at::date = CURRENT_DATE
      ) as approved_today,
      COALESCE(SUM(total_budget) FILTER (
        WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      ), 0) as total_budget,
      COALESCE(
        AVG(EXTRACT(EPOCH FROM (exec_approved_at - created_at)) / 3600)
        FILTER (WHERE exec_approved_by = $1),
        0
      )::text || 'h' as avg_approval_time
    FROM requests
  `, [session.user.id]);

  return NextResponse.json({
    ok: true,
    stats: stats.rows[0],
  });
}
```

---

## ✅ **IMPLEMENTATION CHECKLIST:**

### VP Portal:
- [ ] Create directory structure
- [ ] Build VPLeftNav component
- [ ] Create VP layout
- [ ] Build VP dashboard
- [ ] Build VP inbox
- [ ] Build VP history page
- [ ] Build VP analytics page
- [ ] Create VP inbox API
- [ ] Create VP analytics API
- [ ] Create VP approval API
- [ ] Test VP workflow

### President Portal:
- [ ] Create directory structure
- [ ] Build PresidentLeftNav component
- [ ] Create President layout
- [ ] Build President dashboard
- [ ] Build President inbox
- [ ] Build President history page
- [ ] Build President analytics page
- [ ] Build President policy page
- [ ] Create President inbox API
- [ ] Create President analytics API
- [ ] Create President approval API
- [ ] Create policy management API
- [ ] Test President workflow

---

## 🎯 **EXPECTED OUTCOMES:**

After implementation:
- ✅ VP can review standard requests
- ✅ VP can approve or delegate to President
- ✅ President can review all requests
- ✅ President can override any decision
- ✅ Both have analytics dashboards
- ✅ Complete executive hierarchy working

---

**Total Time:** 12-16 hours  
**Files to Create:** ~20 files  
**APIs to Build:** ~8 endpoints  
**Complexity:** Medium  
**Priority:** High (required for full workflow)
