import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, parseJsonParam } from '../utils/tool-response.js';

export function registerConversionTools(server: McpServer, client: MetaApiClient): void {
  server.tool(
    'send_conversion_event',
    'Send a server-side conversion event to the Meta Conversions API via a pixel. This is used for tracking offline conversions, server-side events, and CRM data. Events are attributed to ad clicks/views using user_data matching. Always hash PII (email, phone, name) with SHA-256 before sending. Use test_event_code during development to validate events in Events Manager without affecting production data.',
    {
      pixel_id: z
        .string()
        .describe(
          'Meta Pixel ID to send the event to. Use list_pixels to find pixel IDs. Example: "123456789012345".',
        ),
      event_name: z
        .string()
        .describe(
          'Standard or custom event name. Standard events: Purchase, Lead, CompleteRegistration, ViewContent, AddToCart, AddToWishlist, InitiateCheckout, AddPaymentInfo, Search, Contact, FindLocation, Schedule, StartTrial, SubmitApplication, Subscribe, CustomizeProduct, Donate. Custom events: any string (e.g. "PremiumSignup").',
        ),
      event_time: z
        .string()
        .describe(
          'Unix timestamp (seconds) when the event occurred. Must be within the last 7 days. Example: "1700000000". Use Math.floor(Date.now()/1000) for current time.',
        ),
      action_source: z
        .string()
        .describe(
          'Where the event originated. Values: "website" (browser/pixel), "app" (mobile app), "email" (email click), "phone_call" (call center), "chat" (messaging), "physical_store" (in-store), "system_generated" (automated), "other".',
        ),
      user_data: z
        .string()
        .describe(
          'JSON string of user matching parameters. All PII values (em, ph, fn, ln, ct, st, zp, country) MUST be SHA-256 hashed before sending. Example: {"em":["a1b2c3...hash"],"ph":["d4e5f6...hash"],"client_ip_address":"1.2.3.4","client_user_agent":"Mozilla/5.0...","fbc":"fb.1.123.456","fbp":"fb.1.123.789","external_id":["user123"]}. Keys: em=email, ph=phone, fn=first_name, ln=last_name, ct=city, st=state, zp=zip, country=country, external_id=your_user_id, fbc=click_id_cookie, fbp=browser_id_cookie.',
        ),
      custom_data: z
        .string()
        .optional()
        .describe(
          'JSON string of event-specific data. Example: {"value":99.99,"currency":"USD","content_name":"Premium Plan","content_ids":["SKU123"],"content_type":"product","order_id":"ORD-456"}. For Purchase events, value and currency are required for ROAS reporting.',
        ),
      event_source_url: z
        .string()
        .optional()
        .describe(
          'The URL where the event occurred. Required for website action_source. Example: "https://example.com/checkout/thank-you".',
        ),
      event_id: z
        .string()
        .optional()
        .describe(
          'Unique event ID for deduplication. If both browser pixel and server send the same event, use the same event_id to prevent double-counting. Example: "event_abc123".',
        ),
      test_event_code: z
        .string()
        .optional()
        .describe(
          'Test event code from Events Manager > Test Events tab. When provided, events appear in the Test Events panel instead of being processed as real events. Example: "TEST12345". Remove for production.',
        ),
    },
    async ({ pixel_id, event_name, event_time, action_source, user_data, custom_data, event_source_url, event_id, test_event_code }) => {
      const userDataParsed = parseJsonParam<Record<string, any>>(user_data, 'user_data');
      if (!userDataParsed.ok) return userDataParsed.result;

      let parsedCustomData: Record<string, any> | undefined;
      if (custom_data) {
        const customDataParsed = parseJsonParam<Record<string, any>>(custom_data, 'custom_data');
        if (!customDataParsed.ok) return customDataParsed.result;
        parsedCustomData = customDataParsed.value;
      }

      const eventPayload: Record<string, any> = {
        event_name,
        event_time: Number(event_time),
        action_source,
        user_data: userDataParsed.value,
      };

      if (parsedCustomData) {
        eventPayload.custom_data = parsedCustomData;
      }
      if (event_source_url) {
        eventPayload.event_source_url = event_source_url;
      }
      if (event_id) {
        eventPayload.event_id = event_id;
      }

      const postData: Record<string, any> = {
        data: [eventPayload],
      };

      if (test_event_code) {
        postData.test_event_code = test_event_code;
      }

      const result = await client.post(`/${pixel_id}/events`, postData);
      return okResult(result);
    },
  );
}
