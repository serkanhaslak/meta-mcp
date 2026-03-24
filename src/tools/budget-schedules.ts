import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, parseJsonParam } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerBudgetScheduleTools(server: McpServer, client: MetaApiClient): void {
  // ── get_budget_schedules ─────────────────────────────────────────────
  server.tool(
    'get_budget_schedules',
    'Get budget schedules for a campaign or ad set. Budget schedules allow you to automatically increase or set specific budgets for defined time periods (e.g. boost spend during a flash sale weekend). Returns schedule IDs, budget values, time windows, recurrence settings, and statuses.',
    {
      object_id: z
        .string()
        .describe(
          'The campaign or ad set ID to retrieve budget schedules for (e.g. "123456789"). Budget schedules can be attached to either campaigns or ad sets.',
        ),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return. Defaults to "id,budget_value,budget_value_type,time_start,time_end,recurrence_type,status". Available fields include: id, budget_value (the budget amount in account currency cents or multiplier value), budget_value_type (ABSOLUTE or MULTIPLIER), time_start (ISO 8601 start time), time_end (ISO 8601 end time), recurrence_type (NONE for one-time or WEEKLY for recurring), status (ACTIVE, PAUSED, etc.).',
        ),
    },
    async ({ object_id, fields }) => {
      const result = await client.get(`/${object_id}/budget_schedules`, {
        fields: fields ?? DEFAULT_FIELDS.BUDGET_SCHEDULE,
      });
      return okResult(result);
    },
  );

  // ── create_budget_schedule ───────────────────────────────────────────
  server.tool(
    'create_budget_schedule',
    'Create a budget schedule for a campaign or ad set. Budget schedules let you define time-bound budget overrides — for example, doubling your budget during a product launch weekend or setting a fixed high budget for a flash sale. You can define up to 50 schedule periods per campaign or ad set. The parent object must use a lifetime budget for ABSOLUTE schedules or a daily budget for MULTIPLIER schedules.',
    {
      object_id: z
        .string()
        .describe(
          'The campaign or ad set ID to attach the budget schedule to (e.g. "123456789"). The object must already exist and have an appropriate budget type set.',
        ),
      budget_schedule_spec: z
        .string()
        .describe(
          'JSON string containing an array of schedule period objects. Each object defines a time window and budget override. Maximum 50 periods per object. Required fields per period: "time_start" (ISO 8601 datetime, e.g. "2025-06-01T00:00:00+0000"), "time_end" (ISO 8601 datetime, e.g. "2025-06-07T23:59:59+0000"), "budget_value" (string amount in account currency cents for ABSOLUTE, or multiplier like "1.5" for 50% increase), "budget_value_type" ("ABSOLUTE" for a fixed budget amount during the period, or "MULTIPLIER" for a relative increase over the base daily budget — e.g. "2.0" means 2x the normal daily budget). Example: [{"time_start":"2025-06-01T00:00:00+0000","time_end":"2025-06-07T23:59:59+0000","budget_value":"10000","budget_value_type":"ABSOLUTE"}]',
        ),
    },
    async ({ object_id, budget_schedule_spec }) => {
      const parsed = parseJsonParam(budget_schedule_spec, 'budget_schedule_spec');
      if (!parsed.ok) return parsed.result;

      const result = await client.post(`/${object_id}/budget_schedules`, {
        budget_schedule_spec: parsed.value,
      });
      return okResult(result);
    },
  );
}
