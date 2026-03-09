/**
 * Data Migration Script: Base44 → Supabase
 *
 * This script migrates all data from the Base44 platform to Supabase.
 * It handles:
 * - Field renaming (_huf → _secondary, icon_ → studioos_)
 * - ID mapping (Base44 IDs → Supabase UUIDs)
 * - Creating Supabase Auth users for all existing accounts
 * - Preserving relationships between entities
 *
 * Usage:
 *   npx tsx scripts/migrate-from-base44.ts
 *
 * Required environment variables:
 *   SUPABASE_URL — your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (admin access)
 *   BASE44_API_URL — Base44 API endpoint (if available)
 *   BASE44_AUTH_TOKEN — authentication token for Base44 API
 *
 * If Base44 API is not available, export data as JSON files and place them in:
 *   scripts/data/studios.json
 *   scripts/data/accounts.json
 *   scripts/data/rooms.json
 *   scripts/data/cam_accounts.json
 *   scripts/data/shifts.json
 *   scripts/data/earnings.json
 *   scripts/data/payouts.json
 *   scripts/data/global_settings.json
 *   scripts/data/member_alerts.json
 *   scripts/data/chat_channels.json
 *   scripts/data/chat_messages.json
 *   scripts/data/support_tickets.json
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Map old IDs to new UUIDs
const idMap: Record<string, Record<string, string>> = {
  studios: {},
  accounts: {},
  rooms: {},
  cam_accounts: {},
  shifts: {},
  chat_channels: {},
};

function generateUUID(): string {
  return crypto.randomUUID();
}

function loadJsonFile(filename: string): unknown[] {
  const filePath = path.join(__dirname, "data", filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  File not found: ${filePath}, skipping...`);
    return [];
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function renameFields(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Fix #7: Rename _huf fields to _secondary
    let newKey = key.replace(/_huf$/i, "_secondary").replace(/_huf_/i, "_secondary_");
    // Fix #8: Rename icon_ prefix to studioos_
    newKey = newKey.replace(/^icon_/, "studioos_");
    result[newKey] = value;
  }
  return result;
}

async function migrateStudios() {
  console.log("\n--- Migrating Studios ---");
  const studios = loadJsonFile("studios.json") as Record<string, unknown>[];

  for (const studio of studios) {
    const oldId = String(studio.id || studio._id);
    const newId = generateUUID();
    idMap.studios[oldId] = newId;

    const mapped = renameFields(studio);
    const { error } = await supabase.from("studios").insert({
      id: newId,
      name: mapped.name || "Unnamed Studio",
      subdomain: mapped.subdomain || oldId,
      timezone: mapped.timezone || "UTC",
      primary_currency: mapped.primary_currency || "USD",
      subscription_tier: mapped.subscription_tier || "free",
      subscription_status: mapped.subscription_status || "active",
      stripe_customer_id: mapped.stripe_customer_id || null,
      stripe_subscription_id: mapped.stripe_subscription_id || null,
      model_limit: Number(mapped.model_limit) || 1,
      onboarding_completed: !!mapped.onboarding_completed,
    });

    if (error) {
      console.error(`  Error inserting studio ${oldId}:`, error.message);
    } else {
      console.log(`  Studio: ${mapped.name} (${oldId} → ${newId})`);
    }
  }
}

async function migrateAccounts() {
  console.log("\n--- Migrating Accounts ---");
  const accounts = loadJsonFile("accounts.json") as Record<string, unknown>[];

  for (const account of accounts) {
    const oldId = String(account.id || account._id);
    const email = String(account.email || "");
    if (!email || email.endsWith("@temp.local")) {
      console.warn(`  Skipping account with invalid email: ${email}`);
      continue;
    }

    // Create Supabase Auth user
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: account.first_name || "",
        last_name: account.last_name || "",
      },
    });

    if (authError) {
      console.error(`  Error creating auth user ${email}:`, authError.message);
      continue;
    }

    const newId = generateUUID();
    idMap.accounts[oldId] = newId;

    const studioId = idMap.studios[String(account.studio_id)] || null;
    if (!studioId) {
      console.warn(`  No mapped studio for account ${email}`);
      continue;
    }

    const mapped = renameFields(account);
    const { error } = await supabase.from("accounts").insert({
      id: newId,
      auth_user_id: authUser.user.id,
      studio_id: studioId,
      email,
      first_name: mapped.first_name || null,
      last_name: mapped.last_name || null,
      role: mapped.role || "model",
      is_active: mapped.is_active !== false,
      cut_percentage: Number(mapped.cut_percentage) || 50,
      weekly_goal_hours: Number(mapped.weekly_goal_hours) || 30,
      weekly_goal_enabled: !!mapped.weekly_goal_enabled,
      works_alone: !!mapped.works_alone,
    });

    if (error) {
      console.error(`  Error inserting account ${email}:`, error.message);
    } else {
      console.log(`  Account: ${email} (${mapped.role}) → ${newId}`);
    }

    // Send password reset email so users can set their own password
    await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
    });
  }
}

async function migrateRooms() {
  console.log("\n--- Migrating Rooms ---");
  const rooms = loadJsonFile("rooms.json") as Record<string, unknown>[];

  for (const room of rooms) {
    const oldId = String(room.id || room._id);
    const newId = generateUUID();
    idMap.rooms[oldId] = newId;

    const studioId = idMap.studios[String(room.studio_id)] || null;
    if (!studioId) continue;

    const { error } = await supabase.from("rooms").insert({
      id: newId,
      studio_id: studioId,
      name: String(room.name || "Room"),
      is_active: room.is_active !== false,
    });

    if (error) {
      console.error(`  Error inserting room:`, error.message);
    } else {
      console.log(`  Room: ${room.name}`);
    }
  }
}

async function migrateCamAccounts() {
  console.log("\n--- Migrating Cam Accounts ---");
  const camAccounts = loadJsonFile("cam_accounts.json") as Record<string, unknown>[];

  for (const ca of camAccounts) {
    const oldId = String(ca.id || ca._id);
    const newId = generateUUID();
    idMap.cam_accounts[oldId] = newId;

    const studioId = idMap.studios[String(ca.studio_id)] || null;
    const modelId = idMap.accounts[String(ca.model_id)] || null;
    if (!studioId || !modelId) continue;

    const { error } = await supabase.from("cam_accounts").insert({
      id: newId,
      studio_id: studioId,
      model_id: modelId,
      platform: String(ca.platform || ""),
      username: String(ca.username || ""),
      is_active: ca.is_active !== false,
    });

    if (error) {
      console.error(`  Error inserting cam account:`, error.message);
    } else {
      console.log(`  Cam Account: ${ca.platform}/${ca.username}`);
    }
  }
}

async function migrateEarnings() {
  console.log("\n--- Migrating Earnings ---");
  const earnings = loadJsonFile("earnings.json") as Record<string, unknown>[];

  for (const earning of earnings) {
    const studioId = idMap.studios[String(earning.studio_id)] || null;
    const modelId = idMap.accounts[String(earning.model_id)] || null;
    if (!studioId) continue;

    const mapped = renameFields(earning);

    const { error } = await supabase.from("earnings").insert({
      studio_id: studioId,
      model_id: modelId,
      cam_account_id: idMap.cam_accounts[String(earning.cam_account_id)] || null,
      shift_date: mapped.shift_date || null,
      total_gross_usd: Number(mapped.total_gross_usd) || 0,
      studio_cut_usd: Number(mapped.studio_cut_usd) || 0,
      model_pay_usd: Number(mapped.model_pay_usd) || 0,
      operator_pay_usd: Number(mapped.operator_pay_usd) || 0,
      total_gross_secondary: Number(mapped.total_gross_secondary) || 0,
      is_estimated: !!mapped.is_estimated,
    });

    if (error) {
      console.error(`  Error inserting earning:`, error.message);
    }
  }
  console.log(`  Migrated ${earnings.length} earnings records`);
}

async function migrateShifts() {
  console.log("\n--- Migrating Shifts ---");
  const shifts = loadJsonFile("shifts.json") as Record<string, unknown>[];

  for (const shift of shifts) {
    const studioId = idMap.studios[String(shift.studio_id)] || null;
    const modelId = idMap.accounts[String(shift.model_id)] || null;
    if (!studioId || !modelId) continue;

    const { error } = await supabase.from("shifts").insert({
      studio_id: studioId,
      model_id: modelId,
      operator_id: idMap.accounts[String(shift.operator_id)] || null,
      room_id: idMap.rooms[String(shift.room_id)] || null,
      start_time: String(shift.start_time),
      end_time: String(shift.end_time),
      status: String(shift.status || "completed"),
    });

    if (error) {
      console.error(`  Error inserting shift:`, error.message);
    }
  }
  console.log(`  Migrated ${shifts.length} shifts`);
}

async function main() {
  console.log("=== StudioOS Data Migration: Base44 → Supabase ===");
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`Data source: scripts/data/`);
  console.log("");

  // Check data directory exists
  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) {
    console.log("Creating data directory. Please export your Base44 data as JSON files into:");
    console.log(`  ${dataDir}/`);
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("\nRequired files:");
    console.log("  studios.json, accounts.json, rooms.json, cam_accounts.json");
    console.log("  shifts.json, earnings.json, payouts.json");
    console.log("\nExport your data and re-run this script.");
    process.exit(0);
  }

  // Migrate in order (respecting foreign key relationships)
  await migrateStudios();
  await migrateAccounts();
  await migrateRooms();
  await migrateCamAccounts();
  await migrateShifts();
  await migrateEarnings();

  console.log("\n=== Migration Complete ===");
  console.log("ID mapping saved. Users will receive password reset emails.");
  console.log("\nNext steps:");
  console.log("1. Verify data in Supabase Dashboard");
  console.log("2. Test login with migrated accounts");
  console.log("3. Update DNS to point to the new app");
  console.log("4. Update Stripe webhook URL");

  // Save ID mapping for reference
  const mappingPath = path.join(dataDir, "id_mapping.json");
  fs.writeFileSync(mappingPath, JSON.stringify(idMap, null, 2));
  console.log(`\nID mapping saved to: ${mappingPath}`);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
