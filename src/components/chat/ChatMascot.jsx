// The AI assistant's face: the robot from page-mascot (MIT, see
// public/mascots/LICENSE.txt). It follows the cursor and reacts when clicked.
import { Mascot } from 'page-mascot';

export default function ChatMascot({ size = 40, online = false }) {
  return (
    <span className="relative inline-grid shrink-0 place-items-center">
      <Mascot
        directions="/mascots/robot-directions.webp"
        reactions="/mascots/robot-reactions.webp"
        size={size}
        label="AI assistant robot"
      />
      {online && (
        <span
          className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-night bg-emerald-400"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
