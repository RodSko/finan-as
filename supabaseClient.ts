import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ovmpemqpjunbtmfuxzkk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bXBlbXFwanVuYnRtZnV4emtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Nzg2MTEsImV4cCI6MjA4MDA1NDYxMX0.eoO2aOtztiEHUFRsa10_xzPucrb7wTqaMUbw4c4O_Wc';

export const supabase = createClient(supabaseUrl, supabaseKey);