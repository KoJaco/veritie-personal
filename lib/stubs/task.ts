import type { ScopeKey } from "@/lib/lens";
import type { TaskStub, TaskDetailStub, TaskFilters, BlockerStub, RelatedObjectStub, AttachmentSummaryStub } from "./types";
import { getAssigneeStub, getCurrentUser } from "./assignee";
import { randomId, randomDate, randomElement, randomInt, randomBoolean } from "./helpers";

const TASK_TITLES = [
  "Complete Risk Assessment for Q1",
  "Review Access Control Policy",
  "Update Incident Response Procedures",
  "Conduct Vendor Security Review",
  "Implement MFA for Production Systems",
  "Document Change Management Process",
  "Review Resilience Maturity Gaps",
  "Update Business Continuity Plan",
  "Complete Security Awareness Training",
  "Review Third-Party Access Permissions",
  "Validate Backup and Recovery Procedures",
  "Conduct Penetration Test Remediation",
  "Update Data Classification Policy",
  "Review Encryption Standards",
  "Complete Readiness Check Testing",
];

const OBJECT_TITLES = [
  "Access Control Policy",
  "Incident Response Plan",
  "Risk Management Framework",
  "Vendor Management Policy",
  "Data Classification Standard",
  "Change Management Procedure",
  "Business Continuity Plan",
  "Encryption Standard",
];

const BLOCKER_TYPES: BlockerStub["type"][] = ["dependency", "approval", "resource", "information"];

const BLOCKER_DESCRIPTIONS: Record<BlockerStub["type"], string[]> = {
  dependency: ["Waiting on API integration completion", "Blocked by vendor response", "Requires infrastructure provision"],
  approval: ["Pending security team sign-off", "Awaiting management approval", "Needs operations review"],
  resource: ["No available security engineer", "Budget approval pending", "Tool license expired"],
  information: ["Missing requirements from business", "Awaiting clarification on scope", "Need access documentation"],
};

const SCOPE_POOL: ScopeKey[] = [
  "operations-readiness",
  "delivery-observability",
  "workspace-resilience",
  "knowledge-hygiene",
];

function getScopeIds(): ScopeKey[] {
  const primary = randomElement(SCOPE_POOL);
  if (randomBoolean(0.3)) {
    const secondary = randomElement(
      SCOPE_POOL.filter((scopeId) => scopeId !== primary),
    );
    return [primary, secondary];
  }
  return [primary];
}

function getTaskPriority(status: TaskStub["status"]): TaskStub["priority"] {
  if (status === "blocked") return randomElement(["high", "critical"]);
  if (status === "in_progress") return randomElement(["medium", "high"]);
  return randomElement(["low", "medium"]);
}

function getTaskAttachmentStatus(): TaskStub["attachmentStatus"] {
  const rand = Math.random();
  if (rand < 0.3) return "complete";
  if (rand < 0.5) return "missing";
  if (rand < 0.7) return "required";
  return "none";
}

export function getTaskStub(overrides?: Partial<TaskStub>): TaskStub {
  const status = overrides?.status ?? randomElement(["todo", "in_progress", "blocked", "done"]);
  const attachmentStatus = getTaskAttachmentStatus();
  const assignToMe = randomBoolean(0.4);

  const task: TaskStub = {
    id: randomId("task"),
    title: randomElement(TASK_TITLES),
    status,
    priority: getTaskPriority(status),
    dueAt: status === "done" ? null : randomDate(randomInt(-5, 14)),
    assignee: assignToMe ? getCurrentUser() : getAssigneeStub(),
    relatedObject: randomBoolean(0.7)
      ? {
          id: randomId("obj"),
          type: randomElement(["policy", "procedure", "risk", "assessment"]),
          title: randomElement(OBJECT_TITLES),
        }
      : undefined,
    attachmentStatus,
    missingAttachmentCount: attachmentStatus === "missing" ? randomInt(1, 3) : 0,
    updatedAt: randomDate(randomInt(-7, 0)),
    scopeIds: randomBoolean(0.9) ? getScopeIds() : undefined,
  };

  return { ...task, ...overrides };
}

export function getTasksStub(count = 10, filters?: TaskFilters): TaskStub[] {
  let tasks: TaskStub[] = [];

  // Generate a mix of tasks for realistic distribution
  const blockedCount = Math.ceil(count * 0.15);
  const doneCount = Math.ceil(count * 0.2);
  const inProgressCount = Math.ceil(count * 0.25);
  const todoCount = count - blockedCount - doneCount - inProgressCount;

  for (let i = 0; i < blockedCount; i++) {
    tasks.push(getTaskStub({ status: "blocked" }));
  }
  for (let i = 0; i < doneCount; i++) {
    tasks.push(getTaskStub({ status: "done" }));
  }
  for (let i = 0; i < inProgressCount; i++) {
    tasks.push(getTaskStub({ status: "in_progress" }));
  }
  for (let i = 0; i < todoCount; i++) {
    tasks.push(getTaskStub({ status: "todo" }));
  }

  // Apply filters
  if (filters) {
    if (filters.status) {
      tasks = tasks.filter((t) => filters.status!.includes(t.status));
    }
    if (filters.assignee === "me") {
      tasks = tasks.filter((t) => t.assignee.isMe);
    }
    if (filters.due === "overdue") {
      const now = new Date();
      tasks = tasks.filter((t) => t.dueAt && new Date(t.dueAt) < now);
    }
    if (filters.attachments === "missing_only") {
      tasks = tasks.filter((t) => t.attachmentStatus === "missing");
    }
  }

  // Sort by priority and due date
  return tasks.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return 0;
  });
}

export function getTaskDetailStub(id: string): TaskDetailStub {
  const task = getTaskStub({ id });
  const blockers: BlockerStub[] =
    task.status === "blocked"
      ? [
          {
            id: randomId("blocker"),
            type: randomElement(BLOCKER_TYPES),
            description: randomElement(BLOCKER_DESCRIPTIONS[randomElement(BLOCKER_TYPES)]),
          },
        ]
      : [];

  const linkedAttachments: AttachmentSummaryStub[] = [];
  if (task.attachmentStatus !== "none") {
    const attachmentCount = task.attachmentStatus === "complete" ? randomInt(2, 4) : randomInt(0, 2);
    for (let i = 0; i < attachmentCount; i++) {
      linkedAttachments.push({
        id: randomId("att"),
        filename: randomElement(["access_review.xlsx", "policy_v2.pdf", "screenshot.png", "audit_log.csv"]),
        status: task.attachmentStatus === "complete" ? "accepted" : randomElement(["uploaded", "needs_review"]),
      });
    }
  }

  const linkedObjects: RelatedObjectStub[] = task.relatedObject
    ? [task.relatedObject]
    : randomBoolean(0.6)
    ? [
        {
          id: randomId("obj"),
          type: randomElement(["policy", "procedure"]),
          title: randomElement(OBJECT_TITLES),
        },
      ]
    : [];

  return {
    ...task,
    description: `This task is part of the ${task.relatedObject?.title ?? "operations"} requirements and must be completed to maintain operations with relevant security standards.`,
    checkContext: task.relatedObject
      ? `Linked to ${task.relatedObject.type}: ${task.relatedObject.title}. This check requires attachment of completion for review purposes.`
      : "This task is part of the overall operations program.",
    blockers,
    linkedAttachments,
    linkedObjects,
  };
}

// Specialized getters for common queries
export function getOverdueTasksStub(): TaskStub[] {
  return getTasksStub(5, { due: "overdue" });
}

export function getTasksNeedingAttachmentStub(): TaskStub[] {
  return getTasksStub(5, { attachments: "missing_only" });
}

export function getMyTasksStub(): TaskStub[] {
  return getTasksStub(8, { assignee: "me" });
}

export function getTaskSummaryStub(task: TaskStub, now: Date): import("./types").TaskSummaryStub {
  const blockingReasons: string[] = [];

  if (task.status === "blocked") {
    blockingReasons.push("Task is blocked");
  }
  if (task.missingAttachmentCount > 0) {
    blockingReasons.push(`Missing ${task.missingAttachmentCount} attachment item${task.missingAttachmentCount === 1 ? "" : "s"}`);
  }
  if (task.dueAt && new Date(task.dueAt) < now) {
    blockingReasons.push("Overdue");
  }

  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt,
    relatedObjectTitle: task.relatedObject?.title,
    blockingReason: blockingReasons.length > 0 ? blockingReasons.join("; ") : "No blockers",
  };
}

export function getTaskSummariesStub(tasks: TaskStub[], now: Date): import("./types").TaskSummaryStub[] {
  return tasks.map((task) => getTaskSummaryStub(task, now));
}
