import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall }) {
  return (
    <div className="p-3 border-b flex items-center justify-end w-full bg-base-100 z-10">
      <button onClick={handleVideoCall} className="btn btn-success text-white gap-2">
        <VideoIcon className="size-5" />
        Video Call
      </button>
    </div>
  );
}

export default CallButton;