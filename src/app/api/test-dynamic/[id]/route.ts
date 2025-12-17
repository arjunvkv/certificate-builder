import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Test dynamic route called with ID:', id);
    
    return NextResponse.json({
      success: true,
      message: 'Dynamic route working',
      receivedId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test dynamic route:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}