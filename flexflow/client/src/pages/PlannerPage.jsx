import { useState } from 'react';
import { WeeklyPlanner } from '@/components/planner/index.js';
import { useApp } from '@/context/AppContext.jsx';
import { generateScheduleFromOnboarding } from '@/domain/schedule/autoSchedule.js';
import { computeWeeklyScheduleScore } from '@/domain/schedule/scoring.js';
import { api } from '@/services/api/index.js';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';

export function PlannerPage() {
  const { userId, user, blocks, setBlocks, loadBlocks } = useApp();
  const [regenBusy, setRegenBusy] = useState(false);
  const bed = user?.bed_time || '22:30';
  const weekly = computeWeeklyScheduleScore(blocks, bed);

  const regenerate = async () => {
    if (!userId || !user?.onboarding) return;
    setRegenBusy(true);
    try {
      const gen = generateScheduleFromOnboarding(user.onboarding);
      await api.clearBlocks(userId);
      await api.bulkBlocks(userId, gen);
      await loadBlocks(userId);
    } catch (e) {
      console.error(e);
    } finally {
      setRegenBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-100px)] min-h-[640px]">
      <PageHeader
        title="Weekly planner"
        description="Drag blocks, resize from the bottom edge, double-click empty space to add. Tap a block to edit — reminders can ping your browser."
        actions={
          <>
            <Card className="px-4 py-3 min-w-[160px] !shadow-none" lift>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                Weekly score
              </p>
              <p className="text-2xl font-display font-bold">
                {weekly.total}
                <span className="text-slate-500 text-base font-semibold">/100</span>
              </p>
            </Card>
            <Button
              variant="secondary"
              size="lg"
              type="button"
              onClick={regenerate}
              disabled={regenBusy}
            >
              {regenBusy ? 'Regenerating…' : 'Regenerate from setup'}
            </Button>
          </>
        }
      />
      <div className="flex-1 min-h-0">
        <WeeklyPlanner
          blocks={blocks}
          userId={userId}
          bedTime={bed}
          onBlocksChange={setBlocks}
        />
      </div>
    </div>
  );
}
