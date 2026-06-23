"use client";

import type { LucideIcon } from "lucide-react";

export type ProfileTabId =
  | "profile"
  | "security"
  | "notification"
  | "payments"
  | "privacy";

export interface ProfileTabItem {
  id: ProfileTabId;
  label: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  verified: boolean;
}

export interface QuickStat {
  label: string;
  value: string;
}

export interface ProfileContactItem {
  label: string;
  value: string;
  icon: LucideIcon;
}

export interface PreferenceItem {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
}

export interface BillingTransaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: string;
}

export interface SessionItem {
  id: string;
  device: string;
  location: string;
  lastActive: string;
}

export interface ConfirmAction {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}
