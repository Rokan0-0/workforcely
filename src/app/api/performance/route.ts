import { NextRequest, NextResponse } from 'next/server';
import { db, PerformanceReview, Goal } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');

  let list = db.getPerformanceReviews();

  if (employeeId) {
    list = list.filter(r => r.employeeId === employeeId);
  }

  return NextResponse.json({ reviews: list });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, employeeId, reviewCycle, rating, comments, reviewerId, goals, reviewId, goalId, goalStatus } = body;

    const reviews = db.getPerformanceReviews();

    if (action === 'createReview') {
      if (!employeeId || !reviewCycle || !rating || !reviewerId) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }

      const parsedGoals: Goal[] = (goals || []).map((g: any, i: number) => ({
        id: `g-${Date.now()}-${i}`,
        title: g.title || 'General Goal',
        weight: Number(g.weight) || 0,
        status: g.status || 'Not Started'
      }));

      const newReview: PerformanceReview = {
        id: `rev-${Date.now()}`,
        employeeId,
        reviewCycle,
        rating: Number(rating),
        goals: parsedGoals,
        comments: comments || '',
        reviewerId,
        date: new Date().toISOString().split('T')[0]
      };

      reviews.push(newReview);
      db.updatePerformanceReviews(reviews);

      return NextResponse.json({ success: true, review: newReview });
    }

    if (action === 'updateGoalStatus') {
      if (!reviewId || !goalId || !goalStatus) {
        return NextResponse.json({ success: false, error: 'Review ID, Goal ID, and Goal Status are required' }, { status: 400 });
      }

      const revIndex = reviews.findIndex(r => r.id === reviewId);
      if (revIndex === -1) {
        return NextResponse.json({ success: false, error: 'Performance review not found' }, { status: 404 });
      }

      const goalIndex = reviews[revIndex].goals.findIndex(g => g.id === goalId);
      if (goalIndex === -1) {
        return NextResponse.json({ success: false, error: 'Goal not found inside review' }, { status: 404 });
      }

      reviews[revIndex].goals[goalIndex].status = goalStatus;
      db.updatePerformanceReviews(reviews);

      return NextResponse.json({ success: true, review: reviews[revIndex] });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
