export interface MetaApiResponse<T = any> {
  data?: T[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
  error?: MetaApiError;
}

export interface MetaApiError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
  is_transient?: boolean;
}

export interface BatchSubRequest {
  method: 'GET' | 'POST' | 'DELETE';
  relative_url: string;
  body?: string;
}

export interface BatchSubResponse {
  code: number;
  headers: Array<{ name: string; value: string }>;
  body: string;
}

export interface BucUsageEntry {
  call_count: number;
  total_cputime: number;
  total_time: number;
  type: string;
  estimated_time_to_regain_access: number;
}

export interface RateLimitState {
  callCount: number;
  totalCputime: number;
  totalTime: number;
  estimatedRecovery: number;
  lastUpdated: number;
}

export interface InsightsParams {
  fields?: string;
  time_range?: string;
  date_preset?: string;
  breakdowns?: string;
  level?: string;
  filtering?: string;
  limit?: number;
}

export interface TargetingSpec {
  geo_locations?: {
    countries?: string[];
    regions?: Array<{ key: string }>;
    cities?: Array<{ key: string; radius?: number; distance_unit?: string }>;
  };
  age_min?: number;
  age_max?: number;
  genders?: number[];
  interests?: Array<{ id: string; name: string }>;
  behaviors?: Array<{ id: string; name: string }>;
  custom_audiences?: Array<{ id: string }>;
  excluded_custom_audiences?: Array<{ id: string }>;
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
  device_platforms?: string[];
}

export interface ConversionEvent {
  event_name: string;
  event_time: number;
  action_source: string;
  user_data: {
    em?: string[];
    ph?: string[];
    fn?: string[];
    ln?: string[];
    ct?: string[];
    st?: string[];
    zp?: string[];
    country?: string[];
    external_id?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    order_id?: string;
    num_items?: number;
  };
  event_source_url?: string;
  event_id?: string;
  opt_out?: boolean;
}
