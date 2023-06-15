"use client";
import { createClient } from "@supabase/supabase-js";
import { Database } from "types/supabase";

const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabasePublicKey)
  throw new Error(`Expected env var NEXT_PUBLIC_SUPABASE_ANON_KEY`);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error(`Expected env var NEXT_PUBLIC_SUPABASE_URL`);

const supabaseBrowserClient = createClient<Database>(
  supabaseUrl,
  supabasePublicKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 100,
      },
    },
  }
);

export { supabaseBrowserClient };
