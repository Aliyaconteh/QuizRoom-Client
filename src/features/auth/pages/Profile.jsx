import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, UserCircle, Trophy, Award, Gamepad2, Layers, Flame, Calendar, Clock, ChevronRight } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/ToastContext";
import { apiUrl } from "../../../config/api";

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, token } = useAuth();
  const { addToast } = useToast();

  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    quizzesCreated: 0,
    wins: 0,
    podiums: 0,
    totalPoints: 0,
    avgScore: 0,
    history: []
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const initials = useMemo(() => {
    if (!user?.username) return "U";
    return user.username.charAt(0).toUpperCase();
  }, [user]);

  useEffect(() => {
    if (!token) return;
    setStatsLoading(true);
    fetch(apiUrl("/api/auth/stats"), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setStats(json.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user stats:", err);
      })
      .finally(() => setStatsLoading(false));
  }, [token]);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!username.trim()) {
      addToast("Please enter a display name", { type: "error" });
      return;
    }

    setProfileLoading(true);
    try {
      await updateProfile(username.trim());
      addToast("Profile updated", { type: "success" });
    } catch (error) {
      addToast(error.message || "Unable to update profile", { type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast("Please fill in all password fields", { type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      addToast("New password must be at least 6 characters", { type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast("New passwords do not match", { type: "error" });
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      addToast("Password updated", { type: "success" });
    } catch (error) {
      addToast(error.message || "Unable to change password", { type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex w-fit items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 transition hover:border-blue-500/50 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* User Stats Overview Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              <Gamepad2 size={15} className="text-blue-400" />
              Games Played
            </div>
            <p className="text-2xl font-black text-white">{stats.gamesPlayed}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Multiplayer sessions</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              <Trophy size={15} className="text-amber-400" />
              Victories
            </div>
            <p className="text-2xl font-black text-amber-400">{stats.wins}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">1st place finishes</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              <Layers size={15} className="text-violet-400" />
              Quizzes Created
            </div>
            <p className="text-2xl font-black text-violet-400">{stats.quizzesCreated}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Custom question sets</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              <Award size={15} className="text-emerald-400" />
              Avg Score
            </div>
            <p className="text-2xl font-black text-emerald-400">{stats.avgScore}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Points per match</p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold">
                {initials}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Account</p>
                <h1 className="text-2xl font-semibold">Your profile</h1>
                <p className="text-sm text-slate-400">Manage your identity and appearance</p>
              </div>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleProfileSave}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Display name</label>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500"
                  placeholder="Enter your name"
                />
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <UserCircle size={16} />
                  Signed in as {user?.email || "your account"}
                </div>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileLoading ? "Saving..." : "Save profile"}
              </button>
            </form>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-blue-400" />
                <h2 className="text-xl font-semibold">Change password</h2>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handlePasswordChange}>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500"
                  placeholder="Current password"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500"
                  placeholder="New password"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500"
                  placeholder="Confirm password"
                />

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 font-semibold text-slate-100 transition hover:border-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {passwordLoading ? "Updating..." : "Change password"}
                </button>
              </form>
            </section>
          </div>
        </div>

        {/* Game History Panel */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gamepad2 size={20} className="text-indigo-400" />
              <h2 className="text-xl font-semibold">Recent Game History</h2>
            </div>
            {statsLoading && <span className="text-xs text-slate-500">Loading history...</span>}
          </div>

          {stats.history && stats.history.length > 0 ? (
            <div className="space-y-2.5">
              {stats.history.map((game, idx) => (
                <div
                  key={game.id || idx}
                  className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 transition hover:border-slate-700"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 font-bold text-slate-300 text-sm">
                      #{game.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{game.roomName}</p>
                      <p className="text-xs text-slate-500">Room Code: {game.roomCode}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-black text-emerald-400">{game.score} pts</p>
                    <p className="text-[10px] text-slate-500">
                      {game.playedAt ? new Date(game.playedAt).toLocaleDateString() : "Recent"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm">
              No game history found yet. Join a room to start tracking your performance!
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
