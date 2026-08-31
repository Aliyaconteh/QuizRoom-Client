import { useState, useEffect, useRef, memo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  PlusCircle,
  Trash2,
  Save,
  Clock,
  ChevronDown,
  Sparkles,
  Upload,
  Sliders,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  Download,
  FileCode
} from "lucide-react";
import { useToast } from "../../../components/ui/ToastContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

// ══════════════════════════════════════════════
//  Reusable components
// ══════════════════════════════════════════════
const MotionButton = motion.button;
const MotionDiv = motion.div;

// Dropdown for correct answer selection
const CorrectAnswerSelect = memo(function CorrectAnswerSelect({
  options,
  value,
  onChange,
  hasError
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(Boolean);
  const baseClass = `w-full bg-[#0f1720] border-[1.5px] rounded-xl px-4 py-3 outline-none transition-all duration-150 cursor-pointer flex items-center justify-between ${
    hasError ? "border-red-500/70" : "border-slate-700/50"
  } ${open ? "border-indigo-500 bg-indigo-500/[0.05] ring-2 ring-indigo-500/10" : ""}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={baseClass}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={value ? "text-slate-100 truncate pr-2" : "text-slate-600 truncate pr-2"}
        >
          {value || "Correct answer"}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 left-0 right-0 mt-1.5 bg-[#0f1720] border border-slate-700/60 rounded-xl shadow-xl shadow-black/50 overflow-hidden"
            role="listbox"
          >
            {filtered.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={value === option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-100 ${
                  value === option
                    ? "bg-indigo-500/15 text-indigo-300 font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// Error banner
const ErrorBanner = memo(function ErrorBanner({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
    >
      <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
      <p className="text-sm text-red-400">{message}</p>
    </motion.div>
  );
});

// Question card (extracted for memoisation)
const QuestionCard = memo(function QuestionCard({
  index,
  item,
  isOnly,
  updateQuestion,
  updateOption,
  markTouched,
  touched,
  inputClass,
  removeQuestion
}) {
  const hasQuestionError = touched[`q${index}`] && !item.question.trim();
  const hasOptionError = touched[`q${index}_opts`] && item.options.some((o) => !o.trim());
  const hasCorrectError = touched[`q${index}_correct`] && !item.correctAnswer.trim();

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-[#0d131c]/80 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors duration-200"
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-sm font-bold text-indigo-400">
            {index + 1}
          </div>
          <h2 className="text-xl font-extrabold">Question {index + 1}</h2>
        </div>
        {!isOnly && (
          <button
            onClick={() => removeQuestion(index)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-950/50 border border-red-900/50 text-red-300 hover:bg-red-900/70 px-3 py-2 text-sm font-semibold transition-all duration-200"
            aria-label="Remove question"
          >
            <Trash2 size={13} />
            Remove
          </button>
        )}
      </div>

      <input
        value={item.question}
        onChange={(e) => updateQuestion(index, { question: e.target.value })}
        onBlur={() => markTouched(`q${index}`)}
        className={`${inputClass(hasQuestionError)} mb-4`}
        placeholder="Enter your question"
      />

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {item.options.map((option, optIdx) => (
          <div key={optIdx} className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">
              {String.fromCharCode(65 + optIdx)}
            </span>
            <input
              value={option}
              onChange={(e) => updateOption(index, optIdx, e.target.value)}
              onBlur={() => markTouched(`q${index}_opts`)}
              className={`${inputClass(hasOptionError && !option.trim())} pl-8`}
              placeholder={`Option ${optIdx + 1}`}
            />
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <CorrectAnswerSelect
          options={item.options}
          value={item.correctAnswer}
          onChange={(val) => {
            updateQuestion(index, { correctAnswer: val });
            markTouched(`q${index}_correct`);
          }}
          hasError={hasCorrectError}
        />
        <div className="relative">
          <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="number"
            min="5"
            max="120"
            value={item.timeLimit}
            onChange={(e) => updateQuestion(index, { timeLimit: e.target.value })}
            className={`${inputClass(false)} pl-9`}
            placeholder="Time limit"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-600 font-semibold">
            sec
          </span>
        </div>
      </div>
    </MotionDiv>
  );
});

// ══════════════════════════════════════════════
//  Helper
// ══════════════════════════════════════════════
const emptyQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  timeLimit: 15
});

// ══════════════════════════════════════════════
//  Main Page
// ══════════════════════════════════════════════
export default function CreateQuiz() {
  const navigate = useNavigate();
  const { authFetch, user, isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [aiMode, setAiMode] = useState("document");
  const [aiFile, setAiFile] = useState(null);
  const [aiTopic, setAiTopic] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState("Mixed");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});



  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isAuthenticated, authLoading, navigate]);

  const updateQuestion = useCallback((index, updates) => {
    setQuestions((items) => items.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  }, []);

  const updateOption = useCallback((qIdx, optIdx, value) => {
    setQuestions((items) =>
      items.map((item, i) => {
        if (i !== qIdx) return item;
        const options = [...item.options];
        options[optIdx] = value;
        return { ...item, options };
      })
    );
  }, []);

  const markTouched = useCallback((field) => {
    setTouched((p) => ({ ...p, [field]: true }));
  }, []);

  const removeQuestion = useCallback((index) => {
    setQuestions((items) => items.filter((_, i) => i !== index));
  }, []);

  const saveQuiz = async () => {
    setError("");
    // Mark all fields touched for validation
    const allTouched = { title: true };
    questions.forEach((_, i) => {
      allTouched[`q${i}`] = true;
      allTouched[`q${i}_opts`] = true;
      allTouched[`q${i}_correct`] = true;
    });
    setTouched(allTouched);

    if (!title.trim()) {
      setError("Quiz title is required.");
      addToast("Quiz title is required.", { type: "error" });
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError("Every question needs text.");
        addToast("Every question needs text.", { type: "error" });
        return;
      }
      if (q.options.some((o) => !o.trim())) {
        setError("Every question needs four options.");
        addToast("Every question needs four options.", { type: "error" });
        return;
      }
      if (!q.correctAnswer || !String(q.correctAnswer).trim()) {
        setError("Select a correct answer for every question.");
        addToast("Select a correct answer for every question.", { type: "error" });
        return;
      }
    }

    setSaving(true);
    try {
      const quizRes = await authFetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), created_by: user.id })
      }).then((res) => res.json());

      if (!quizRes.success) throw new Error(quizRes.message || "Could not create quiz");

      for (const q of questions) {
        const qRes = await authFetch("/api/quizzes/question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quiz_id: quizRes.data.id,
            question: q.question.trim(),
            options: q.options.map((o) => o.trim()),
            correct_answer: q.correctAnswer.trim(),
            time_limit: Number(q.timeLimit || 15)
          })
        }).then((res) => res.json());

        if (!qRes.success) throw new Error(qRes.message || "Could not save a question");
      }

      addToast("Quiz created successfully!", { type: "success" });
      navigate("/quizzes");
    } catch (err) {
      setError(err.message);
      addToast(err.message, { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const generateQuizWithAI = async () => {
    setAiError("");
    setAiStatus("");
    const topic = aiTopic.trim();
    if (aiMode === "document" && !aiFile) {
      setAiError("Please upload a document first.");
      return;
    }
    if (aiMode === "topic" && !topic) {
      setAiError("Please enter a topic first.");
      return;
    }
    if (!aiQuestionCount || aiQuestionCount < 1 || aiQuestionCount > 50) {
      setAiError("Number of questions must be between 1 and 50.");
      return;
    }

    setAiGenerating(true);
    setAiStatus(aiMode === "document" ? "Uploading document and generating quiz..." : "Generating quiz from topic...");

    try {
      const formData = new FormData();
      if (aiFile) {
        formData.append("document", aiFile);
      }
      formData.append("topic", topic);
      formData.append("numberOfQuestions", String(aiQuestionCount));
      formData.append("difficulty", aiDifficulty);

      const res = await authFetch("/api/ai/generate", {
        method: "POST",
        body: formData
      });
      const payload = await res.json();
      if (!payload.success) throw new Error(payload.message || "AI generation failed.");

      const quiz = payload.data;
      if (!quiz || !Array.isArray(quiz.questions)) throw new Error("Invalid AI response.");

      setTitle(quiz.title || "");
      setAiDescription(quiz.description || "");
      setQuestions(
        quiz.questions.map((item) => {
          const options = item.options?.slice(0, 4).map((o) => o || "") || ["", "", "", ""];
          const correct =
            typeof item.correctAnswer === "number"
              ? options[item.correctAnswer]
              : item.correctAnswer || "";
          return {
            question: item.question || "",
            options,
            correctAnswer: correct,
            timeLimit: 15
          };
        })
      );
      setAiStatus("Quiz generated successfully. Review and save when ready.");
      addToast("AI quiz generated. You can now edit and save it.", { type: "success" });
    } catch (err) {
      setAiError(err.message);
      setAiStatus("");
    } finally {
      setAiGenerating(false);
    }
  };

  const [importStatus, setImportStatus] = useState("");
  const [importError, setImportError] = useState("");
  const [showImport, setShowImport] = useState(false);

  const clearAITool = () => {
    setAiMode("document");
    setAiFile(null);
    setAiTopic("");
    setAiQuestionCount(5);
    setAiDifficulty("Mixed");
    setAiStatus("");
    setAiError("");
    setAiDescription("");
  };

  const downloadCSVTemplate = () => {
    const csvContent = `question,option_a,option_b,option_c,option_d,correct_answer,time_limit\n"What is the capital of Sierra Leone?","Bo","Kenema","Freetown","Makeni","Freetown",15\n"Which protocol is used for real-time web communication?","HTTP/1.0","WebSockets","FTP","SMTP","WebSockets",15\n"What is 15 multiplied by 4?","50","60","65","70","60",20`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kuizroom_questions_template.csv";
    link.click();
    URL.revokeObjectURL(url);
    addToast("Downloaded CSV question template", { type: "success" });
  };

  const handleBulkFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    setImportStatus("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== "string") return;

      try {
        if (file.name.endsWith(".json") || content.trim().startsWith("[")) {
          // Parse JSON
          const parsed = JSON.parse(content);
          if (!Array.isArray(parsed) || !parsed.length) {
            throw new Error("JSON file must contain an array of question objects.");
          }

          const imported = parsed.map((item) => {
            const options = item.options?.slice(0, 4) || [
              item.option_a || "",
              item.option_b || "",
              item.option_c || "",
              item.option_d || ""
            ];
            while (options.length < 4) options.push("");
            const correct =
              typeof item.correctAnswer === "number"
                ? options[item.correctAnswer]
                : item.correctAnswer || item.correct_answer || options[0] || "";

            return {
              question: item.question || item.text || "",
              options,
              correctAnswer: correct,
              timeLimit: Number(item.timeLimit || item.time_limit || 15)
            };
          });

          setQuestions((prev) => [...prev.filter((q) => q.question.trim()), ...imported]);
          setImportStatus(`Successfully imported ${imported.length} questions from JSON.`);
          addToast(`Imported ${imported.length} questions!`, { type: "success" });
        } else {
          // Parse CSV
          const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) {
            throw new Error("CSV file must have a header row and at least one question row.");
          }

          const imported = [];
          // Skip header row if it contains 'question'
          const startIdx = lines[0].toLowerCase().includes("question") ? 1 : 0;

          for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i];
            // Match comma-separated values taking into account quotes
            const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
            const values = [];
            let match;
            while ((match = regex.exec(line)) !== null) {
              let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
              values.push(val.trim());
            }

            if (values.length >= 6) {
              const [qText, opA, opB, opC, opD, correct, timeLimit] = values;
              imported.push({
                question: qText || "",
                options: [opA || "", opB || "", opC || "", opD || ""],
                correctAnswer: correct || opA || "",
                timeLimit: Number(timeLimit) || 15
              });
            }
          }

          if (!imported.length) {
            throw new Error("Could not parse any valid questions. Ensure your CSV columns follow: question,option_a,option_b,option_c,option_d,correct_answer,time_limit");
          }

          setQuestions((prev) => [...prev.filter((q) => q.question.trim()), ...imported]);
          setImportStatus(`Successfully imported ${imported.length} questions from CSV.`);
          addToast(`Imported ${imported.length} questions!`, { type: "success" });
        }
      } catch (err) {
        setImportError(err.message || "Failed to parse question file.");
        addToast(err.message || "Failed to parse question file.", { type: "error" });
      }
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  const inputClass = useCallback(
    (hasError) =>
      `w-full bg-[#0f1720] border-[1.5px] rounded-xl px-4 py-3 outline-none transition-all duration-150 placeholder:text-slate-700 focus:border-indigo-500 focus:bg-indigo-500/[0.05] focus:ring-2 focus:ring-indigo-500/10 ${
        hasError ? "border-red-500/70" : "border-slate-700/50"
      }`,
    []
  );

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : "hidden"}
      animate="visible"
      variants={fadeUp}
      className="min-h-screen bg-[#060a0f] text-white px-4 py-10 relative overflow-hidden"
    >
      {/* Ambient gradients */}
      <div className="absolute w-[520px] h-[520px] rounded-full bg-indigo-500/8 blur-[90px] -top-32 -right-36 pointer-events-none" />
      <div className="absolute w-[380px] h-[380px] rounded-full bg-violet-500/8 blur-[80px] -bottom-20 -left-16 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold tracking-[0.12em] uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-3">
            <PlusCircle size={11} />
            Quiz Builder
          </div>
          <h1 className="text-4xl font-extrabold mt-1">
            Create{" "}
            <span className="bg-gradient-to-br from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Quiz
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {questions.length} question{questions.length !== 1 ? "s" : ""} added
          </p>
        </motion.div>

        {/* Error banner */}
        <AnimatePresence>
          {error && <ErrorBanner message={error} />}
        </AnimatePresence>

        {/* Title input */}
        <motion.div
          variants={fadeUp}
          className="bg-[#0d131c]/80 border border-slate-800 rounded-2xl p-6 mb-5"
        >
          <label className="text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-slate-500 mb-2 block">
            Quiz Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => markTouched("title")}
            className={inputClass(touched.title && !title.trim())}
            placeholder="e.g. Computer Science Basics"
          />
          {touched.title && !title.trim() && (
            <p className="text-xs text-red-400 mt-1.5">Title is required</p>
          )}
        </motion.div>

        {/* AI Generation Section */}
        <motion.div
          variants={fadeUp}
          className="bg-[#0d131c]/80 border border-slate-800 rounded-2xl p-6 mb-5"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                <Sparkles size={16} className="text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Generate with AI</p>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a document or enter a topic and create a quiz automatically
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearAITool}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-indigo-500 hover:text-indigo-300 transition"
            >
              Reset
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-2xl border border-slate-800 bg-slate-950/40 p-1">
              <button
                type="button"
                onClick={() => setAiMode("document")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${aiMode === "document" ? "bg-indigo-500/15 text-indigo-300" : "text-slate-400 hover:text-slate-200"}`}
              >
                Upload file
              </button>
              <button
                type="button"
                onClick={() => setAiMode("topic")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${aiMode === "topic" ? "bg-indigo-500/15 text-indigo-300" : "text-slate-400 hover:text-slate-200"}`}
              >
                Topic only
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Use a study file, or let the AI generate questions from a topic like a chapter, concept, or subject.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div className={aiMode === "topic" ? "sm:col-span-2" : ""}>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                {aiMode === "document" ? <Upload size={12} /> : <FileText size={12} />}
                {aiMode === "document" ? "Document" : "Topic / focus area"}
              </label>
              {aiMode === "document" ? (
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                  className={inputClass(false)}
                />
              ) : (
                <textarea
                  rows="4"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className={`${inputClass(false)} resize-none`}
                  placeholder="e.g. Photosynthesis, quadratic equations, Python lists, or World War II causes"
                />
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Sliders size={12} />
                Number of questions
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={aiQuestionCount}
                onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                className={inputClass(false)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Sliders size={12} />
                Difficulty
              </label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value)}
                className={inputClass(false)}
              >
                <option value="Mixed">Mixed</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="flex items-end sm:col-span-2">
              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateQuizWithAI}
                disabled={aiGenerating}
                className="w-full rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate with AI
                  </>
                )}
              </MotionButton>
            </div>
          </div>

          <AnimatePresence>
            {aiStatus && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-sm text-indigo-200 flex items-center gap-2"
              >
                <CheckCircle2 size={14} className="text-indigo-400" />
                {aiStatus}
              </motion.div>
            )}
            {aiError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200 flex items-center gap-2"
              >
                <AlertTriangle size={14} className="text-red-400" />
                {aiError}
              </motion.div>
            )}
            {aiDescription && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-4 py-3 text-sm text-slate-300"
              >
                <p className="font-semibold text-slate-100 mb-2 flex items-center gap-1.5">
                  <FileText size={12} />
                  AI Description
                </p>
                <p>{aiDescription}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bulk Import Section (CSV / JSON) */}
        <motion.div
          variants={fadeUp}
          className="bg-[#0d131c]/80 border border-slate-800 rounded-2xl p-6 mb-5"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <FileSpreadsheet size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Bulk Import Questions (CSV / JSON)</p>
                <p className="text-xs text-slate-500 mt-1">
                  Upload formatted CSV or JSON files to load multiple questions at once
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowImport(!showImport)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
            >
              {showImport ? "Collapse" : "Expand Import"}
            </button>
          </div>

          <AnimatePresence>
            {showImport && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2"
              >
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Upload size={12} />
                      Choose CSV or JSON File
                    </label>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleBulkFileImport}
                      className={inputClass(false)}
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={downloadCSVTemplate}
                      className="rounded-2xl border border-slate-700 hover:border-emerald-500/50 bg-slate-900/60 px-4 py-3 text-xs font-semibold text-slate-300 hover:text-emerald-300 transition flex items-center justify-center gap-2"
                    >
                      <Download size={14} className="text-emerald-400" />
                      Download Sample CSV Template
                    </button>
                  </div>
                </div>

                {importStatus && (
                  <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    {importStatus}
                  </div>
                )}

                {importError && (
                  <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs text-red-300 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-400" />
                    {importError}
                  </div>
                )}

                <p className="text-[11px] text-slate-500">
                  Supported CSV headers: <code className="text-slate-400">question, option_a, option_b, option_c, option_d, correct_answer, time_limit</code>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Questions list */}
        <div className="space-y-5">
          <AnimatePresence>
            {questions.map((item, index) => (
              <QuestionCard
                key={index}
                index={index}
                item={item}
                isOnly={questions.length === 1}
                updateQuestion={updateQuestion}
                updateOption={updateOption}
                markTouched={markTouched}
                touched={touched}
                inputClass={inputClass}
                removeQuestion={removeQuestion}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom actions */}
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap gap-3 mt-6"
        >
          <MotionButton
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setQuestions((items) => [...items, emptyQuestion()])}
            className="rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 px-5 py-3 font-bold text-slate-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Add Question
          </MotionButton>
          <MotionButton
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveQuiz}
            disabled={saving}
            className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-3 font-bold shadow-[0_4px_16px_rgba(99,102,241,0.25)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.35)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save size={16} />
                Save Quiz
              </>
            )}
          </MotionButton>
        </motion.div>
      </div>
    </motion.div>
  );
}