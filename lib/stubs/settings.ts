import type {
    ProfileStub,
    TeamMemberStub,
    RoleCapabilityStub,
    SettingsStub,
    ScopeMappingConfigStub,
} from "./types";
import { getCurrentUser } from "./assignee";
import { randomDate, randomInt } from "./helpers";

const TEAM_NAMES = [
    "Sarah Chen",
    "Mike Rodriguez",
    "Emily Watson",
    "David Kim",
    "Lisa Thompson",
    "James Wilson",
    "Anna Martinez",
    "Robert Brown",
];

const ROLES = ["Admin", "Member", "Reviewers"];
const CAPABILITIES: RoleCapabilityStub[] = [
    {
        name: "View all tasks",
        description: "Can view all tasks in the workspace",
    },
    {
        name: "Create tasks",
        description: "Can create new tasks and assign them",
    },
    { name: "upload attachment", description: "Can upload attachment files" },
    {
        name: "Review attachment",
        description: "Can review and approve/reject attachment",
    },
    { name: "Manage connections", description: "Can configure integrations" },
    { name: "Manage team", description: "Can invite and manage team members" },
    { name: "Export reports", description: "Can export operations reports" },
    { name: "Manage policies", description: "Can create and edit policies" },
];

const SCOPE_MAPPING_CONFIG_STUB: ScopeMappingConfigStub = {
    mappingStatus: "invalid",
    topValidationErrors: [
        {
            id: "scope_mapping_owner_missing",
            title: "Missing check owner mapping",
            detail: "3 checks are unmapped to an accountable owner.",
            remediation: {
                label: "Review blocked readiness tasks",
                href: "/work/tasks?scope=operations-readiness&focus=blocked",
            },
        },
        {
            id: "scope_mapping_attachment_gap",
            title: "Attachment requirement mismatch",
            detail: "2 checks reference workflows without linked attachment requirements.",
            remediation: {
                label: "Inspect missing attachments",
                href: "/work/documents?scope=operations-readiness&status=missing",
            },
        },
        {
            id: "scope_mapping_scope_drift",
            title: "Scope mapping mismatch",
            detail: "1 mapped check is assigned to the wrong operating scope.",
            remediation: {
                label: "Open operations readiness scope",
                href: "/work/scopes/operations-readiness?scope=operations-readiness",
            },
        },
    ],
};

export function getProfileStub(): ProfileStub {
    const currentUser = getCurrentUser();
    return {
        name: currentUser.name === "You" ? "Jordan Smith" : currentUser.name,
        email: currentUser.email,
        role: "Admin",
        lastLoginAt: randomDate(randomInt(-7, 0)),
    };
}

export function getTeamStub(): TeamMemberStub[] {
    return TEAM_NAMES.slice(0, 5).map((name, index) => ({
        id: `team_${index + 1}`,
        name,
        email: `${name.toLowerCase().replace(" ", ".")}@company.com`,
        role: ROLES[index % ROLES.length]!,
        status: index === 0 ? "active" : "invited",
    }));
}

export function getScopeMappingConfigStub(): ScopeMappingConfigStub {
    return {
        mappingStatus: SCOPE_MAPPING_CONFIG_STUB.mappingStatus,
        topValidationErrors: SCOPE_MAPPING_CONFIG_STUB.topValidationErrors.map(
            (error) => ({
                ...error,
                remediation: { ...error.remediation },
            }),
        ),
    };
}

/** @deprecated Use getScopeMappingConfigStub */
export function getSoc2FrameworkConfigStub(): ScopeMappingConfigStub {
    return getScopeMappingConfigStub();
}

export function getScopeMappingStatusStub(): "valid" | "invalid" {
    return getScopeMappingConfigStub().mappingStatus;
}

/** @deprecated Use getScopeMappingStatusStub */
export function getSoc2CriteriaSetStatusStub(): "valid" | "invalid" {
    return getScopeMappingStatusStub();
}

export function getSettingsStub(): SettingsStub {
    const scopeMapping = getScopeMappingConfigStub();

    return {
        profile: getProfileStub(),
        team: getTeamStub(),
        capabilities: CAPABILITIES,
        scopeMapping,
        frameworkConfiguration: {
            soc2: scopeMapping,
        },
    };
}
