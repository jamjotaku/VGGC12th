import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://lgcwzlzrovdcjaywvmdk.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnY3d6bHpyb3ZkY2pheXd2bWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMjA1NzksImV4cCI6MjEwNDY5NjU3OX0.-axEWTfGBNrtt2POQn7VgkCSCgQH2v3Wn2SIQSgvKYo';

export const supabaseClient = createClient(supabaseUrl, supabaseKey);
