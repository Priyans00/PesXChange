import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  
  try {
    const { srn } = await req.json();
    
    if (!srn) {
      return NextResponse.json({ error: "SRN is required" }, { status: 400 });
    }

    // Validate SRN format (PES format: PES2UG24CS453)
    const srnPattern = /^PES\d{1}[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;
    if (!srnPattern.test(srn)) {
      return NextResponse.json({ 
        error: "Invalid SRN format. Expected format: PES2UG24CS453" 
      }, { status: 400 });
    }

    // Check if SRN already exists
    const { data, error } = await supabase
      .from('user_profiles')
      .select('srn')
      .eq('srn', srn)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is what we want
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (data) {
      return NextResponse.json({ 
        exists: true, 
        error: "This SRN is already registered" 
      }, { status: 409 });
    }

    return NextResponse.json({ exists: false, message: "SRN is available" });
    
  } catch (error) {
    console.error('Error checking SRN:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
