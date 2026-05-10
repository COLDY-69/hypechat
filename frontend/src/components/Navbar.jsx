
// import { Link, useLocation } from "react-router";
// import useAuthUser from "../hooks/useAuthUser";
// import { BellIcon, LogOutIcon, ShipWheelIcon } from "lucide-react";
// import ThemeSelector from "./ThemeSelector";
// import useLogout from "../hooks/useLogout";

// const Navbar = () => {
//   const { authUser } = useAuthUser();
//   const location = useLocation();
//   const isChatPage = location.pathname?.startsWith("/chat");

//   // const queryClient = useQueryClient();
//   // const { mutate: logoutMutation } = useMutation({
//   //   mutationFn: logout,
//   //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
//   // });

//   const { logoutMutation } = useLogout();

//   return (
//     <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
//       <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex items-center justify-end w-full">
//           {/* LOGO - ONLY IN THE CHAT PAGE */}
//           {isChatPage && (
//             <div className="pl-5">
//               <Link to="/" className="flex items-center gap-2.5">
//                 <ShipWheelIcon className="size-9 text-primary" />
//                 <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
//                   HYPECHAT
//                 </span>
//               </Link>
//             </div>
//           )}

//           <div className="flex items-center gap-3 sm:gap-4 ml-auto">
//             <Link to={"/notifications"}>
//               <button className="btn btn-ghost btn-circle">
//                 <BellIcon className="h-6 w-6 text-base-content opacity-70" />
//               </button>
//             </Link>
//           </div>

//           {/* TODO */}
//           <ThemeSelector />

//           <div className="avatar">
//             <div className="w-9 rounded-full">
//               <img src={authUser?.profilePic} alt="User Avatar" rel="noreferrer" />
//             </div>
//           </div>

//           {/* Logout button */}
//           <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
//             <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// };
// export default Navbar;
import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon, UserCheckIcon, ClockIcon, MessageSquareIcon, XIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFriendRequests, acceptFriendRequest } from "../lib/api";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");
  const { logoutMutation } = useLogout();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [prevCount, setPrevCount] = useState(0);
  const dropdownRef = useRef(null);

  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    refetchInterval: 15000, // poll every 15s for new requests
  });

  const { mutate: acceptRequest, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request accepted!");
    },
  });

  const incomingRequests = friendRequests?.incomingReqs ?? [];
  const acceptedRequests = friendRequests?.acceptedReqs ?? [];
  const totalCount = incomingRequests.length + acceptedRequests.length;

  // ── Toast popup when new notifications arrive ──────────────────────────
  useEffect(() => {
    if (totalCount > prevCount && prevCount !== 0) {
      const diff = totalCount - prevCount;
      toast((t) => (
        <div className="flex items-center gap-3">
          <BellIcon className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="text-sm font-medium">
            You have {diff} new notification{diff > 1 ? "s" : ""}!
          </span>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-auto opacity-50 hover:opacity-100"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      ), {
        duration: 4000,
        style: { minWidth: "260px" },
      });
    }
    setPrevCount(totalCount);
  }, [totalCount]);

  // ── Close dropdown on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end w-full">

          {/* Logo — chat page only */}
          {isChatPage && (
            <div className="pl-5">
              <Link to="/" className="flex items-center gap-2.5">
                <ShipWheelIcon className="size-9 text-primary" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                  HYPECHAT
                </span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">

            {/* ── Notification bell + dropdown ──────────────────────── */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="btn btn-ghost btn-circle relative"
                onClick={() => setOpen((o) => !o)}
              >
                <BellIcon className="h-6 w-6 text-base-content opacity-70" />
                {totalCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                    {totalCount > 9 ? "9+" : totalCount}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {open && (
                <div className="absolute right-0 mt-2 w-80 bg-base-100 border border-base-300 rounded-2xl shadow-xl z-50 overflow-hidden">

                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
                    <span className="font-semibold text-sm">Notifications</span>
                    {totalCount > 0 && (
                      <span className="badge badge-primary badge-sm">{totalCount}</span>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">

                    {/* Empty state */}
                    {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-40">
                        <BellIcon className="w-8 h-8" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    )}

                    {/* Friend Requests */}
                    {incomingRequests.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest opacity-40 px-4 pt-3 pb-1">
                          Friend Requests
                        </p>
                        {incomingRequests.map((req) => (
                          <div
                            key={req._id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors border-b border-base-200"
                          >
                            <div className="avatar w-9 h-9 rounded-full flex-shrink-0">
                              <img src={req.sender.profilePic} alt={req.sender.fullName} className="rounded-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{req.sender.fullName}</p>
                              <div className="flex gap-1 mt-0.5">
                                <span className="badge badge-secondary badge-xs">
                                  {req.sender.nativeLanguage}
                                </span>
                                <span className="badge badge-outline badge-xs">
                                  {req.sender.learningLanguage}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => acceptRequest(req._id)}
                              disabled={isPending}
                              className="text-[11px] font-semibold px-3 py-1 rounded-lg border cursor-pointer flex-shrink-0"
                              style={{
                                background: "rgba(91,79,216,0.1)",
                                color: "#534AB7",
                                borderColor: "rgba(91,79,216,0.2)",
                              }}
                            >
                              Accept
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Accepted / New Connections */}
                    {acceptedRequests.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest opacity-40 px-4 pt-3 pb-1">
                          New Connections
                        </p>
                        {acceptedRequests.map((notif) => (
                          <div
                            key={notif._id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors border-b border-base-200"
                          >
                            <div className="avatar w-9 h-9 rounded-full flex-shrink-0">
                              <img src={notif.recipient.profilePic} alt={notif.recipient.fullName} className="rounded-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{notif.recipient.fullName}</p>
                              <p className="text-xs opacity-50 flex items-center gap-1 mt-0.5">
                                <ClockIcon className="w-3 h-3" />
                                Accepted your request
                              </p>
                            </div>
                            <span className="badge badge-success badge-sm flex-shrink-0">
                              <MessageSquareIcon className="w-3 h-3 mr-1" />
                              Friend
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer — link to full page */}
                  <div className="border-t border-base-300 px-4 py-2.5">
                    <Link
                      to="/notifications"
                      className="text-xs text-primary font-medium hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      See all notifications →
                    </Link>
                  </div>

                </div>
              )}
            </div>
          </div>

          <ThemeSelector />

          <div className="avatar">
            <div className="w-9 rounded-full">
              <img src={authUser?.profilePic} alt="User Avatar" rel="noreferrer" />
            </div>
          </div>

          <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
            <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
          </button>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
