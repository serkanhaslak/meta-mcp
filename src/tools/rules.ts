import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, parseJsonParam } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerRuleTools(server: McpServer, client: MetaApiClient): void {
  // ── list_ad_rules ────────────────────────────────────────────────────
  server.tool(
    'list_ad_rules',
    'List all automated rules for an ad account. Automated rules let you monitor campaigns, ad sets, and ads and take actions (pause, adjust budget, notify) when conditions are met. Returns rule names, statuses, evaluation specs, execution specs, and schedules.',
    {
      account_id: z
        .string()
        .optional()
        .describe(
          'Ad account ID (e.g. "123456789" or "act_123456789"). Falls back to the default account from META_AD_ACCOUNT_ID env var if not provided.',
        ),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return. Defaults to id,name,status,evaluation_spec,execution_spec,schedule_spec,created_time,updated_time. See Meta API docs for all available AdRule fields.',
        ),
    },
    async ({ account_id, fields }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.get(`/${actId}/adrules_library`, {
        fields: fields ?? DEFAULT_FIELDS.RULE_LIST,
      });
      return okResult(result);
    },
  );

  // ── create_ad_rule ───────────────────────────────────────────────────
  server.tool(
    'create_ad_rule',
    'Create a new automated rule for an ad account. Rules automatically monitor your campaigns, ad sets, or ads and take actions when specified conditions are met — such as pausing under-performing ads, increasing budgets for high-performers, or sending notifications when spend thresholds are reached. The rule is defined by an evaluation spec (when and what to check), an execution spec (what action to take), and an optional schedule spec (how often to run).',
    {
      account_id: z
        .string()
        .optional()
        .describe(
          'Ad account ID (e.g. "123456789" or "act_123456789"). Falls back to the default account from META_AD_ACCOUNT_ID env var if not provided.',
        ),
      name: z
        .string()
        .describe(
          'Name of the automated rule. Use a descriptive name for easy identification (e.g. "Pause ads with CPA > $50", "Increase budget for ROAS > 3x").',
        ),
      evaluation_spec: z
        .string()
        .describe(
          'JSON string defining when and what to evaluate. Must include "evaluation_type" (SCHEDULE for periodic checks, TRIGGER for event-based) and "filters" (array of condition objects). Each filter has "field" (metric name like "spent", "cost_per_action_type", "impressions"), "value" (threshold), "operator" (GREATER_THAN, LESS_THAN, EQUAL, NOT_EQUAL, IN_RANGE, NOT_IN_RANGE), and "type" (data type: "int", "float", "string"). For TRIGGER type, also include "trigger" with "type" (STATS_CHANGE for metric changes, METADATA_CREATION for new entity creation). Example: {"evaluation_type":"SCHEDULE","filters":[{"field":"spent","value":100,"operator":"GREATER_THAN","type":"int"}]}',
        ),
      execution_spec: z
        .string()
        .describe(
          'JSON string defining what action to take when conditions are met. Must include "execution_type" (PAUSE, UNPAUSE, CHANGE_BUDGET, CHANGE_BID, ROTATE, NOTIFICATION) and optionally "execution_options" (array of action details). For budget/bid changes, each option has "field" (e.g. "daily_budget", "lifetime_budget", "bid_amount"), "value" (amount or percentage), and "operator" (SET, INCREASE_BY, DECREASE_BY, INCREASE_BY_PERCENTAGE, DECREASE_BY_PERCENTAGE). Example: {"execution_type":"CHANGE_BUDGET","execution_options":[{"field":"daily_budget","value":5000,"operator":"INCREASE_BY_PERCENTAGE"}]}',
        ),
      schedule_spec: z
        .string()
        .optional()
        .describe(
          'JSON string defining how often the rule runs. Includes "schedule_type" (DAILY, HOURLY, SEMI_HOURLY) and optionally "schedule" (array of time window objects with "days" as 0-6 for Sun-Sat, "start_minute" and "end_minute" as minutes from midnight 0-1439). Example: {"schedule_type":"DAILY","schedule":[{"days":[0,1,2,3,4,5,6],"start_minute":0,"end_minute":1439}]} for every day all day.',
        ),
    },
    async ({ account_id, name, evaluation_spec, execution_spec, schedule_spec }) => {
      const actId = client.resolveAccountId(account_id);

      const evalParsed = parseJsonParam(evaluation_spec, 'evaluation_spec');
      if (!evalParsed.ok) return evalParsed.result;

      const execParsed = parseJsonParam(execution_spec, 'execution_spec');
      if (!execParsed.ok) return execParsed.result;

      const data: Record<string, unknown> = {
        name,
        evaluation_spec: evalParsed.value,
        execution_spec: execParsed.value,
      };

      if (schedule_spec) {
        const schedParsed = parseJsonParam(schedule_spec, 'schedule_spec');
        if (!schedParsed.ok) return schedParsed.result;
        data.schedule_spec = schedParsed.value;
      }

      const result = await client.post(`/${actId}/adrules_library`, data);
      return okResult(result);
    },
  );

  // ── get_ad_rule ──────────────────────────────────────────────────────
  server.tool(
    'get_ad_rule',
    'Get detailed information about a specific automated rule by its ID. Returns the full rule configuration including evaluation conditions, execution actions, schedule, and current status. Use this to inspect a rule before updating or to verify it was created correctly.',
    {
      rule_id: z
        .string()
        .describe('The automated rule ID to retrieve (e.g. "123456789"). Get this from list_ad_rules.'),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return. Defaults to id,name,status,evaluation_spec,execution_spec,schedule_spec,created_time,updated_time. See Meta API docs for all available AdRule fields.',
        ),
    },
    async ({ rule_id, fields }) => {
      const result = await client.get(`/${rule_id}`, {
        fields: fields ?? DEFAULT_FIELDS.RULE_LIST,
      });
      return okResult(result);
    },
  );

  // ── update_ad_rule ───────────────────────────────────────────────────
  server.tool(
    'update_ad_rule',
    'Update an existing automated rule. You can modify the name, evaluation conditions, execution actions, schedule, or enable/disable the rule. Only the fields you provide will be updated; others remain unchanged. Use this to adjust thresholds, change actions, or pause rules temporarily.',
    {
      rule_id: z
        .string()
        .describe('The automated rule ID to update (e.g. "123456789"). Get this from list_ad_rules.'),
      name: z
        .string()
        .optional()
        .describe('New name for the automated rule.'),
      evaluation_spec: z
        .string()
        .optional()
        .describe(
          'Updated JSON string defining when and what to evaluate. Same format as create_ad_rule. Include "evaluation_type" and "filters" array. Example: {"evaluation_type":"SCHEDULE","filters":[{"field":"spent","value":200,"operator":"GREATER_THAN","type":"int"}]}',
        ),
      execution_spec: z
        .string()
        .optional()
        .describe(
          'Updated JSON string defining what action to take. Same format as create_ad_rule. Include "execution_type" and optionally "execution_options". Example: {"execution_type":"PAUSE"}',
        ),
      schedule_spec: z
        .string()
        .optional()
        .describe(
          'Updated JSON string defining how often the rule runs. Same format as create_ad_rule. Include "schedule_type" and optionally "schedule" array.',
        ),
      status: z
        .string()
        .optional()
        .describe(
          'New rule status. Valid values: ENABLED (rule is active and will execute), DISABLED (rule is paused and will not execute).',
        ),
    },
    async ({ rule_id, name, evaluation_spec, execution_spec, schedule_spec, status }) => {
      const data: Record<string, unknown> = {};

      if (name) data.name = name;
      if (status) data.status = status;

      if (evaluation_spec) {
        const parsed = parseJsonParam(evaluation_spec, 'evaluation_spec');
        if (!parsed.ok) return parsed.result;
        data.evaluation_spec = parsed.value;
      }
      if (execution_spec) {
        const parsed = parseJsonParam(execution_spec, 'execution_spec');
        if (!parsed.ok) return parsed.result;
        data.execution_spec = parsed.value;
      }
      if (schedule_spec) {
        const parsed = parseJsonParam(schedule_spec, 'schedule_spec');
        if (!parsed.ok) return parsed.result;
        data.schedule_spec = parsed.value;
      }

      const result = await client.post(`/${rule_id}`, data);
      return okResult(result);
    },
  );

  // ── delete_ad_rule ───────────────────────────────────────────────────
  server.tool(
    'delete_ad_rule',
    'Permanently delete an automated rule. This action cannot be undone. The rule will immediately stop evaluating and executing. Any campaigns, ad sets, or ads that were being monitored by this rule will no longer be automatically managed — make sure you have alternative monitoring in place.',
    {
      rule_id: z
        .string()
        .describe(
          'The automated rule ID to delete (e.g. "123456789"). Get this from list_ad_rules. WARNING: This action is irreversible.',
        ),
    },
    async ({ rule_id }) => {
      const result = await client.del(`/${rule_id}`);
      return okResult(result);
    },
  );
}
