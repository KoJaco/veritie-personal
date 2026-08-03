import type { AssigneeStub } from "./types";

const NAMES = [
  "Alex Chen",
  "Jordan Lee",
  "Morgan Smith",
  "Taylor Kim",
  "Casey Jones",
  "Riley Davis",
  "Jamie Wilson",
  "Quinn Brown",
];

const CURRENT_USER: AssigneeStub = {
  id: "user_current",
  name: "You",
  email: "you@company.com",
  isMe: true,
};

export function getAssigneeStub(isMe = false): AssigneeStub {
  if (isMe) return CURRENT_USER;

  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  return {
    id: `user_${Math.random().toString(36).substring(2, 8)}`,
    name,
    email: `${name.toLowerCase().replace(" ", ".")}@company.com`,
    isMe: false,
  };
}

export function getCurrentUser(): AssigneeStub {
  return CURRENT_USER;
}
