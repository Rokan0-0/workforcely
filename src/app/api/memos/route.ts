import { NextRequest, NextResponse } from 'next/server';
import { db, Memo } from '@/lib/db';

export async function GET(request: NextRequest) {
  const memos = db.getMemos();
  return NextResponse.json({ memos });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch((err) => {
      console.error('Failed to parse memo POST payload', err);
      return null;
    });

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unable to parse request body' }, { status: 400 });
    }

    const { action, id, title, content, targetAudience, departmentId } = payload as {
      action: string;
      id?: string;
      title?: string;
      content?: string;
      targetAudience?: string;
      departmentId?: string;
    };

    const memos = db.getMemos();

    if (action === 'createMemo') {
      if (!title || !content || !targetAudience) {
        return NextResponse.json({ success: false, error: 'Title, content, and audience are required' }, { status: 400 });
      }

      if (targetAudience === 'Specific Department' && !departmentId) {
        return NextResponse.json({ success: false, error: 'Department selection is required for Specific Department memos' }, { status: 400 });
      }

      const createdDate = new Date().toISOString().split('T')[0];
      const newMemo: Memo = {
        id: `memo-${Date.now()}`,
        title,
        body: content,
        targetAudience: targetAudience as 'All Staff' | 'Specific Department',
        departmentId: departmentId || undefined,
        createdDate,
      };

      const updatedMemos = [newMemo, ...memos];
      db.updateMemos(updatedMemos);

      try {
        const note = {
          id: `note-${Date.now()}`,
          title: `New Memo: ${title}`,
          message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          audience: (targetAudience === 'All Staff' ? 'All Staff' : 'Specific Department') as 'All Staff' | 'Specific Department',
          departmentId: departmentId || undefined,
          read: false,
          createdDate,
        };
        const currentNotifications = db.getNotifications();
        currentNotifications.push(note);
        db.updateNotifications(currentNotifications);
      } catch (err) {
        console.error('Failed to create memo notification', err);
      }

      return NextResponse.json({ success: true, memo: newMemo, memos: updatedMemos });
    }

    if (action === 'deleteMemo') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'Memo ID is required' }, { status: 400 });
      }

      const existingIndex = memos.findIndex((memo) => memo.id === id);
      if (existingIndex === -1) {
        return NextResponse.json({ success: false, error: 'Memo not found' }, { status: 404 });
      }

      const updatedMemos = memos.filter((memo) => memo.id !== id);
      db.updateMemos(updatedMemos);
      return NextResponse.json({ success: true, memos: updatedMemos });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error instanceof Error ? error.message : 'Invalid request payload') }, { status: 400 });
  }
}
