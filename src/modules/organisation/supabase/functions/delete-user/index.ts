import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { corsHeaders } from 'https://deno.land/x/cors/mod.ts';

Deno.serve(async (req) => {
  console.log('🔍 Edge Function called with method:', req.method);
  console.log('🔍 Request URL:', req.url);
  console.log('🔍 Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔍 Handling OPTIONS preflight request');
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': '*', // Be more specific in production
        'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,POST,PUT,OPTIONS',
        'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
      }
    })
  }

  // Accept both POST and DELETE methods
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    console.log('🔍 Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Be more specific in production
        }
      }
    );
  }

  try {
    console.log('🔍 Parsing request body...');
    const { userId } = await req.json();
    console.log('🔍 Received userId:', userId);
    
    if (!userId) {
      console.log('🔍 No userId provided');
      return new Response(
        JSON.stringify({ error: 'User ID is required' }), 
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Be more specific in production
          }
        }
      );
    }

    console.log('🔍 Creating Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // 1. Delete from auth.users
    console.log('🔍 Deleting from auth.users...');
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('🔍 Auth deletion error:', authError);
      throw authError;
    }
    console.log('🔍 Successfully deleted from auth.users');
    
    // 2. Delete from profiles
    console.log('🔍 Deleting from profiles...');
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) {
      console.error('🔍 Profile deletion error:', profileError);
      throw profileError;
    }
    console.log('🔍 Successfully deleted from profiles');
    
    // 3. Clean up related records
    console.log('🔍 Cleaning up related records...');
    const { error: accessError } = await supabase
      .from('physical_location_access')
      .delete()
      .eq('user_id', userId);
    
    if (accessError) {
      console.error('🔍 Physical location access deletion error:', accessError);
      // Don't throw here, as the main deletion was successful
    } else {
      console.log('🔍 Successfully cleaned up related records');
    }
    
    // Return success response
    console.log('🔍 Returning success response');
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User and associated records deleted successfully' 
      }), 
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Be more specific in production
        },
      }
    );

  } catch (error) {
    console.error('🔍 User deletion failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }), 
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Be more specific in production
        },
      }
    );
  }
});
