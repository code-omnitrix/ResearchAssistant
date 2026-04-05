import { TutorPanel } from '../Chat/TutorPanel';
import { InfiniteCanvas } from './InfiniteCanvas';
import { PipelineFeed } from '../Pipeline/PipelineFeed';

export function CanvasScreen() {
  return (
    <div className="flex h-full overflow-hidden">
      <TutorPanel />
      <div className="relative h-full min-w-0 flex-1">
        <InfiniteCanvas />
        <PipelineFeed />
      </div>
    </div>
  );
}
