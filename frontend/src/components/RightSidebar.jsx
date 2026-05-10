import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import {
  getFriendRequests,
  getUserFriends,
  acceptFriendRequest,
} from "../lib/api";

// ── Avatar colour helpers ──────────────────────────────────────────────────
const PALETTE = [
  { bg: "bg-teal-100",   text: "text-teal-800"   },
  { bg: "bg-blue-100",   text: "text-blue-800"   },
  { bg: "bg-pink-100",   text: "text-pink-800"   },
  { bg: "bg-amber-100",  text: "text-amber-800"  },
  { bg: "bg-purple-100", text: "text-purple-800" },
  { bg: "bg-green-100",  text: "text-green-800"  },
  { bg: "bg-red-100",    text: "text-red-800"    },
];

function avatarColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function Avatar({ name = "", size = "w-8 h-8", fontSize = "text-xs" }) {
  const c = avatarColor(name);
  return (
    <div className={`${size} ${c.bg} ${c.text} ${fontSize} font-medium rounded-full flex items-center justify-center flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-2">
      {children}
    </p>
  );
}

const RightSidebar = () => {
  const queryClient = useQueryClient();
  const [declined, setDeclined] = useState(new Set());

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { mutate: accept } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const incomingRequests = (friendRequests?.incomingReqs ?? []).filter(
    (r) => !declined.has(r._id)
  );
  const onlineFriends = friends.filter((f) => f.isOnline);
  const unreadCount = 0; // swap with real unread query when available

  return (
    <aside className="w-56 flex-shrink-0 border-l border-base-300 bg-base-100 flex flex-col h-screen sticky top-0 overflow-y-auto">

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div className="p-3 border-b border-base-300">
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>Messages</SectionLabel>
          {unreadCount > 0 && (
            <span className="badge badge-error badge-xs">{unreadCount}</span>
          )}
        </div>

        {friends.length === 0 ? (
          <p className="text-xs opacity-40">No chats yet</p>
        ) : (
          <div className="divide-y divide-base-200">
            {friends.slice(0, 5).map((f) => (
              <Link
                key={f._id}
                to={`/chat/${f._id}`}
                className="flex items-center gap-2 py-2 hover:opacity-75 transition-opacity"
              >
                <div className="relative flex-shrink-0">
                  {f.profilePic ? (
                    <img src={f.profilePic} className="w-7 h-7 rounded-full object-cover" alt={f.fullName} />
                  ) : (
                    <Avatar name={f.fullName} size="w-7 h-7" fontSize="text-[10px]" />
                  )}
                  <span
                    className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-base-100 ${
                      f.isOnline ? "bg-success" : "bg-base-300"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{f.fullName}</p>
                  <p className="text-[10px] opacity-40 truncate">
                    {f.nativeLanguage ?? "Say hello!"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Online Now ────────────────────────────────────────────────── */}
      <div className="p-3 border-b border-base-300">
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>Online Now</SectionLabel>
          <span className="text-[10px] text-success font-semibold">{onlineFriends.length}</span>
        </div>

        {onlineFriends.length === 0 ? (
          <p className="text-xs opacity-40">No one online</p>
        ) : (
          <div className="divide-y divide-base-200">
            {onlineFriends.slice(0, 5).map((f) => (
              <Link
                key={f._id}
                to={`/chat/${f._id}`}
                className="flex items-center gap-2 py-2 hover:opacity-75 transition-opacity"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                {f.profilePic ? (
                  <img src={f.profilePic} className="w-6 h-6 rounded-full object-cover flex-shrink-0" alt={f.fullName} />
                ) : (
                  <Avatar name={f.fullName} size="w-6 h-6" fontSize="text-[9px]" />
                )}
                <p className="text-xs font-medium truncate">{f.fullName}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Friend Requests ───────────────────────────────────────────── */}
      <div className="p-3 flex-1">
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>Friend Requests</SectionLabel>
          {incomingRequests.length > 0 && (
            <span className="badge badge-warning badge-xs">{incomingRequests.length}</span>
          )}
        </div>

        {incomingRequests.length === 0 ? (
          <p className="text-xs opacity-40">No pending requests</p>
        ) : (
          <div className="divide-y divide-base-200">
            {incomingRequests.map((req) => (
              <div key={req._id} className="flex items-center gap-2 py-2">
                {req.sender?.profilePic ? (
                  <img
                    src={req.sender.profilePic}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    alt={req.sender?.fullName}
                  />
                ) : (
                  <Avatar name={req.sender?.fullName ?? "?"} size="w-7 h-7" fontSize="text-[10px]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{req.sender?.fullName}</p>
                  <p className="text-[10px] opacity-40 truncate">
                    {req.sender?.nativeLanguage ?? "Wants to connect"}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => accept(req._id)}
                    className="text-[10px] font-medium px-2 py-1 rounded-md border cursor-pointer"
                    style={{
                      background: "rgba(91,79,216,0.1)",
                      color: "#534AB7",
                      borderColor: "rgba(91,79,216,0.2)",
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setDeclined((d) => new Set([...d, req._id]))}
                    className="text-[10px] px-1.5 py-1 rounded-md border border-base-300 opacity-40 hover:opacity-70 cursor-pointer bg-transparent"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </aside>
  );
};

export default RightSidebar;
