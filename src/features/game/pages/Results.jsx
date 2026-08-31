import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trophy, Users, Star, ArrowLeft, Crown, Medal, Download, BookOpen, CheckCircle, ChevronDown, ChevronUp, FileSpreadsheet, Activity } from "lucide-react";
import { useGame } from "../../../context/GameContext";
import { apiUrl } from "../../../config/api";
import { useToast } from "../../../components/ui/ToastContext";

const rankStyles = [
  { bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-400", badge: "bg-amber-500/20", icon: Crown },
  { bg: "bg-slate-400/15", border: "border-slate-400/30", text: "text-slate-300", badge: "bg-slate-400/20", icon: Medal },
  { bg: "bg-orange-600/15", border: "border-orange-600/30", text: "text-orange-400", badge: "bg-orange-600/20", icon: Medal },
];

export default function Results() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { leaderboard, setLeaderboard, resetGame } = useGame();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!leaderboard?.length) {
      setLoading(true);
      fetch(apiUrl(`/api/leaderboard/${roomCode}/final`))
        .then((res) => res.json())
        .then((response) => {
          if (!response.success) throw new Error(response.message || "Could not load results");
          setLeaderboard(response.data || []);
        })
        .catch((err) => {
          setError(err.message);
          addToast(err.message, { type: "error" });
        })
        .finally(() => setLoading(false));
    }

    // Fetch question review
    setReviewLoading(true);
    fetch(apiUrl(`/api/leaderboard/${roomCode}/review`))
      .then((res) => res.json())
      .then((response) => {
        if (response.success && response.data?.questions) {
          setReviewQuestions(response.data.questions);
        }
      })
      .catch(() => {})
      .finally(() => setReviewLoading(false));
  }, [leaderboard?.length, roomCode, setLeaderboard, addToast]);

  const sorted = useMemo(
    () => [...(leaderboard || [])].sort((a, b) => Number(b.score || 0) - Number(a.score || 0)),
    [leaderboard]
  );
  const winner = sorted[0];
  const totalScore = sorted.reduce((sum, p) => sum + Number(p.score || 0), 0);

  const handleExportLeaderboardCSV = () => {
    if (!sorted.length) return;
    const headers = ["Rank", "Username", "Score", "RoomCode", "ExportedAt"];
    const rows = [headers.join(",")];
    sorted.forEach((p, idx) => {
      rows.push([
        idx + 1,
        `"${p.username || p.player_id || "Player"}"`,
        Number(p.score || 0),
        roomCode,
        `"${new Date().toISOString()}"`
      ].join(","));
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-leaderboard-${roomCode}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Exported session leaderboard CSV", { type: "success" });
  };

  const handleExportSyncCSV = () => {
    window.open(apiUrl(`/api/sync/export/${roomCode}?format=csv`), "_blank");
  };

  const handleBackToHome = () => {
    resetGame();
    navigate("/");
  };

  return (
    <div
      className={`min-h-screen bg-[#060a0f] text-white px-4 py-10 relative overflow-hidden transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}
    >
      {/* Ambient blobs */}
      <div className="absolute w-[520px] h-[520px] rounded-full bg-amber-500/6 blur-[90px] -top-32 -right-36 pointer-events-none" />
      <div className="absolute w-[380px] h-[380px] rounded-full bg-indigo-500/6 blur-[80px] -bottom-20 -left-16 pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-8" style={{ animation: "slideUp 0.5s ease both" }}>
          <p className="text-slate-500 uppercase tracking-[0.12em] text-sm font-semibold">Room {roomCode}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-2">
            Game{" "}
            <span className="bg-gradient-to-br from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Results
            </span>
          </h1>
        </div>

        {/* Stats summary */}
        {sorted.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6" style={{ animation: "slideUp 0.5s ease both", animationDelay: "0.1s" }}>
            <div className="bg-[#0d131c]/80 border border-slate-800 rounded-2xl p-4 text-center">
              <Users size={16} className="text-indigo-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-white">{sorted.length}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Players</p>
            </div>
            <div className="bg-[#0d131c]/80 border border-slate-800 rounded-2xl p-4 text-center">
              <Star size={16} className="text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-white">{Number(winner?.score || 0)}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Top Score</p>
            </div>
            <div className="bg-[#0d131c]/80 border border-slate-800 rounded-2xl p-4 text-center">
              <Trophy size={16} className="text-amber-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-white">{totalScore}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Points</p>
            </div>
          </div>
        )}

        {/* Winner banner */}
        {winner && (
          <div
            className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 mb-6 text-center relative overflow-hidden"
            style={{ animation: "confettiBurst 0.5s cubic-bezier(0.34,1.56,0.64,1) both", animationDelay: "0.2s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                <Crown size={24} className="text-amber-400" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400">Winner</p>
              <h2 className="text-3xl font-extrabold mt-1 text-white">
                {winner.username || "Player"}
              </h2>
              <p className="font-bold mt-1 text-amber-300">{Number(winner.score || 0)} points</p>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#0d131c]/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReview(!showReview)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
                showReview 
                  ? "bg-indigo-600 text-white border-indigo-500" 
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
            >
              <BookOpen size={14} />
              {showReview ? "Hide Questions Review" : "Review Questions"}
              {showReview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLeaderboardCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
              title="Export leaderboard as CSV"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              Export Leaderboard CSV
            </button>
            <button
              onClick={handleExportSyncCSV}
              className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-bold flex items-center gap-1.5 border border-indigo-500/30 transition"
              title="Export synchronization research metrics"
            >
              <Activity size={14} className="text-indigo-400" />
              Export Sync CSV
            </button>
          </div>
        </div>

        {/* Question Review Section */}
        {showReview && (
          <div className="bg-[#0d131c]/90 border border-indigo-500/30 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-400" />
              Post-Quiz Question Review
            </h2>

            {reviewLoading ? (
              <p className="text-sm text-slate-500 py-4">Loading questions...</p>
            ) : reviewQuestions.length > 0 ? (
              <div className="space-y-4">
                {reviewQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                      Question {idx + 1}
                    </p>
                    <h3 className="font-bold text-white text-base mb-3">{q.question}</h3>
                    <div className="grid sm:grid-cols-2 gap-2 mb-3">
                      {(q.options || []).map((opt) => {
                        const isCorrect = opt === q.correct_answer;
                        return (
                          <div
                            key={opt}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between border ${
                              isCorrect 
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" 
                                : "bg-slate-800/40 border-slate-800 text-slate-400"
                            }`}
                          >
                            <span>{opt}</span>
                            {isCorrect && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-slate-400 bg-slate-800/50 rounded-lg p-2.5 border border-slate-800">
                        <strong className="text-slate-300">Explanation: </strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4">No questions review available for this quiz session.</p>
            )}
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-[#0d131c]/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              Final Leaderboard
            </h2>
            {loading && <span className="text-sm text-slate-500">Loading...</span>}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {sorted.map((player, index) => {
              const rank = rankStyles[index];
              return (
                <div
                  key={player.id || player.player_id || player.playerId}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all duration-300 ${
                    rank
                      ? `${rank.bg} ${rank.border}`
                      : "bg-slate-800/40 border-slate-700/50"
                  }`}
                  style={{ animation: "staggerFade 0.4s ease both", animationDelay: `${0.3 + index * 0.06}s` }}
                >
                  <div className="flex items-center gap-3">
                    {rank ? (
                      <div className={`w-7 h-7 rounded-lg ${rank.badge} flex items-center justify-center`}>
                        <rank.icon size={14} className={rank.text} />
                      </div>
                    ) : (
                      <span className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center text-xs font-bold text-slate-500">
                        {index + 1}
                      </span>
                    )}
                    <span className="font-semibold text-slate-100">
                      {player.username || player.player_id || "Player"}
                    </span>
                  </div>
                  <span className={`font-black text-lg ${rank ? rank.text : "text-emerald-400"}`}>
                    {Number(player.score || 0)}
                  </span>
                </div>
              );
            })}

            {!loading && !sorted.length && (
              <div className="text-center py-8">
                <p className="text-slate-500 font-medium">No results have been recorded for this room yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <button
          onClick={handleBackToHome}
          className="btn-shimmer w-full mt-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 py-3.5 font-bold shadow-[0_4px_16px_rgba(99,102,241,0.25)] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(99,102,241,0.35)] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>
      </div>
    </div>
  );
}
