// The robot at the top of the chat: follows the cursor (or taps on phones) and
// reacts when you tap it. See RobotFace.jsx.
import RobotFace from './RobotFace';

export default function ChatMascot({ size = 40, online = false }) {
  return (
    <span className="relative inline-grid shrink-0 place-items-center">
      <RobotFace size={size} interactive />
      {online && (
        <span
          className="pointer-events-none absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-night bg-emerald-400"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
