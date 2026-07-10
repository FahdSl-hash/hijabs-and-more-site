// ==========================================================================
// SUPABASE CONFIG
// Fill these in after creating your free project at https://supabase.com
// Find them in: Project Settings -> API
// ==========================================================================
const SUPABASE_URL = "https://lfpmvqcztajopfmbxecj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3QmKNhKhKBIN2aczXBnDiA_ldXvmdv9";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================================================
// PAYSTACK CONFIG
// Find this in: Paystack Dashboard -> Settings -> API Keys & Webhooks
// Use the PUBLIC key here, never the secret key.
// ==========================================================================
const PAYSTACK_PUBLIC_KEY = "YOUR_PAYSTACK_PUBLIC_KEY";

// ==========================================================================
// BUSINESS INFO
// ==========================================================================
const WHATSAPP_NUMBER = "2349132896489"; // country code + number, no leading 0
const BUSINESS_ADDRESS = "Behind police barrack, Birnin Kebbi";
const BUSINESS_PHONE = "09132896489";
