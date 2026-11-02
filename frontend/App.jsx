
import { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import "./App.css";

const API_URL = "http://localhost:5000/api";

// Helper: format labels
const formatLabel = (value) =>
  String(value)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

// Helper: render values
function renderValue(value) {
  if (value === null || value === undefined) return null;

  if (Array.isArray(value)) {
    return (
      <ul>
        {value.map((item, index) => (
          <li key={index}>{renderValue(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    return (
      <div>
        {Object.entries(value).map(([key, item]) => (
          <p key={key}>
            <strong>{formatLabel(key)}:</strong>{" "}
            {typeof item === "object"
              ? renderValue(item)
              : String(item ?? "")}
          </p>
        ))}
      </div>
    );
  }

  return String(value);
}

// Helper: prepare PDF content
function flattenForPDF(value, prefix = "") {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenForPDF(item));
  }

  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      flattenForPDF(item, formatLabel(key))
    );
  }

  return [`${prefix ? prefix + ": " : ""}${String(value)}`];
}

// PDF Download
function downloadResumeAnalysisPDF(analysis) {
  try {
    if (!analysis || typeof analysis !== "object") {
      alert("No resume analysis available.");
      return;
    }

    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;

    let y = 20;

    pdf.setFontSize(20);
    pdf.text("NEXORA AI", 15, y);

    y += 12;

    pdf.setFontSize(16);
    pdf.text("Resume Analysis Report", 15, y);

    y += 12;

    pdf.setFontSize(12);

    const sections = [
      ["Resume Score", analysis.score ?? analysis.totalScore ?? 0],
      ["Score Breakdown", analysis.scoreBreakdown],
      ["Verified Skills", analysis.verifiedSkills],
      ["Strengths", analysis.strengths],
      ["Areas for Improvement", analysis.areasForImprovement],
      ["Recommended Skills", analysis.recommendedSkills],
      ["Action Plan", analysis.actionPlan],
      ["Project Feedback", analysis.projectFeedback]
    ];

    sections.forEach(([heading, content]) => {
      if (content === undefined || content === null) return;

      if (Array.isArray(content) && content.length === 0) return;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);

      if (y > pageHeight - 25) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(heading, 15, y);
      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      const lines = flattenForPDF(content);

      lines.forEach((line) => {
        const wrapped = pdf.splitTextToSize(
          String(line),
          pageWidth - 30
        );

        wrapped.forEach((textLine) => {
          if (y > pageHeight - 15) {
            pdf.addPage();
            y = 20;
          }

          pdf.text(textLine, 15, y);
          y += 6;
        });
      });

      y += 5;
    });

    pdf.save("NEXORA_AI_Resume_Analysis.pdf");
  } catch (error) {
    console.error("PDF download error:", error);
    alert("Unable to generate PDF. Please try again.");
  }
}

// Main Application
function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("nexora_token") || ""
  );

  const [authMode, setAuthMode] = useState("login");

  const [authData, setAuthData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [summary, setSummary] = useState("");
  const [jobRole, setJobRole] = useState("MERN Stack Developer");
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fileInput = useRef(null);
  const chatEnd = useRef(null);

  const selectedDocument = documents.find(
    (doc) => String(doc._id || doc.id) === String(selectedId)
  );

  // API Request
  const apiRequest = async (endpoint, options = {}) => {
    const headers = {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `Request failed: ${response.status}`
      );
    }

    return data;
  };

  // Load Documents
  const loadDocuments = async () => {
    try {
      setLoading(true);

      const data = await apiRequest("/documents");

      const list = Array.isArray(data)
        ? data
        : data.documents || data.data || [];

      setDocuments(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load documents after login
  useEffect(() => {
    if (token) {
      loadDocuments();
    }
  }, [token]);

  // Scroll Chat
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Authentication
  const handleAuth = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    try {
      setLoading(true);

      const endpoint =
        authMode === "login" ? "/auth/login" : "/auth/register";

      const data = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authData)
      });

      const result = await data.json();

      if (!data.ok) {
        throw new Error(result.message || "Authentication failed");
      }

      const accessToken = result.token || result.accessToken;

      if (!accessToken) {
        throw new Error("Authentication token was not received.");
      }

      localStorage.setItem("nexora_token", accessToken);
      setToken(accessToken);

      setMessage("Login successful!");
      setAuthData({ name: "", email: "", password: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("nexora_token");
    setToken("");
    setDocuments([]);
    setSelectedId("");
    setChat([]);
    setSummary("");
    setAnalysis(null);
    setActiveTab("overview");
    setMessage("");
    setError("");
  };

  // Upload PDF
  const uploadDocument = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "title",
      file.name.replace(/\.pdf$/i, "")
    );

    try {
      setUploading(true);
      setError("");
      setMessage("");

      await apiRequest("/documents/upload", {
        method: "POST",
        body: formData
      });

      setMessage("Document uploaded successfully!");

      await loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // Delete Document
  const deleteDocument = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      await apiRequest(`/documents/${id}`, {
        method: "DELETE"
      });

      setDocuments((previous) =>
        previous.filter((doc) => String(doc._id || doc.id) !== String(id))
      );

      if (String(selectedId) === String(id)) {
        setSelectedId("");
        setChat([]);
        setSummary("");
        setAnalysis(null);
      }

      setMessage("Document deleted successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  // AI Chat
  const askAI = async (event) => {
    event.preventDefault();

    if (!selectedId || !question.trim()) {
      setError("Select a document and enter your question.");
      return;
    }

    const currentQuestion = question.trim();

    setChat((previous) => [
      ...previous,
      { role: "user", content: currentQuestion }
    ]);

    setQuestion("");
    setChatLoading(true);
    setError("");

    try {
      const data = await apiRequest("/ai/ask", {
        method: "POST",
        body: JSON.stringify({
          documentId: selectedId,
          question: currentQuestion
        })
      });

      const answer =
        data.answer ||
        data.response ||
        data.result ||
        data.message ||
        "No answer received.";

      setChat((previous) => [
        ...previous,
        { role: "assistant", content: answer }
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  // Generate Summary
  const generateSummary = async () => {
    if (!selectedId) {
      setError("Please select a document first.");
      return;
    }

    try {
      setSummaryLoading(true);
      setError("");
      setSummary("");

      const data = await apiRequest("/ai/summarize", {
        method: "POST",
        body: JSON.stringify({
          documentId: selectedId
        })
      });

      setSummary(
        data.summary || data.result || data.response || data
      );

      setMessage("Summary generated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Analyze Resume
  const analyzeResume = async () => {
    if (!selectedId) {
      setError("Please select a resume first.");
      return;
    }

    if (!jobRole.trim()) {
      setError("Please enter a target job role.");
      return;
    }

    try {
      setAnalysisLoading(true);
      setError("");
      setAnalysis(null);

      const data = await apiRequest("/resume-analyzer/analyze", {
        method: "POST",
        body: JSON.stringify({
          documentId: selectedId,
          jobRole
        })
      });

      const result = data.analysis || data.result || data;

      setAnalysis(result);
      setMessage("Resume analysis completed successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Login / Register Screen
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">✧ NEXORA AI</div>

          <h1>
            {authMode === "login" ? "Welcome Back" : "Create Account"}
          </h1>

          <p>Your intelligent document workspace.</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleAuth}>
            {authMode === "register" && (
              <input
                type="text"
                placeholder="Full Name"
                value={authData.name}
                onChange={(e) =>
                  setAuthData({ ...authData, name: e.target.value })
                }
                required
              />
            )}

            <input
              type="email"
              placeholder="Email Address"
              value={authData.email}
              onChange={(e) =>
                setAuthData({ ...authData, email: e.target.value })
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={authData.password}
              onChange={(e) =>
                setAuthData({ ...authData, password: e.target.value })
              }
              required
            />

            <button type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : authMode === "login"
                  ? "Login"
                  : "Register"}
            </button>
          </form>

          <p>
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
            {" "}
            <button
              className="text-btn"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {authMode === "login" ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">✧ NEXORA AI</div>

        <p className="sidebar-label">WORKSPACE</p>

        {[
          ["overview", "⌂", "Dashboard"],
          ["documents", "▤", "My Documents"],
          ["chat", "✧", "AI Assistant"],
          ["summary", "☷", "AI Summary"],
          ["analyzer", "◈", "Resume Analyzer"]
        ].map(([tab, icon, label]) => (
          <button
            key={tab}
            className={`nav-item ${activeTab === tab ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab);
              setError("");
              setMessage("");
            }}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={logout}>
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>
              {formatLabel(activeTab)}
            </h2>
            <p>Welcome to your intelligent workspace.</p>
          </div>

          <button
            className="upload-btn"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "+ Upload PDF"}
          </button>
        </header>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {message && (
          <div className="success-message">
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {activeTab === "overview" && (
          <>
            <section className="welcome-section">
              <h1>Welcome to NEXORA AI ✧</h1>
              <p>
                Manage documents, ask AI questions and improve your career.
              </p>
            </section>

            <div className="stats-grid">
              <div className="stat-card">
                <span>▤</span>
                <p>Total Documents</p>
                <h2>{documents.length}</h2>
              </div>

              <div className="stat-card">
                <span>✧</span>
                <p>AI Features</p>
                <h2>03</h2>
                <small>Questions, summaries & analysis</small>
              </div>

              <div className="stat-card">
                <span>◈</span>
                <p>Selected Document</p>
                <h2>{selectedDocument ? "01" : "00"}</h2>
              </div>
            </div>

            <section className="content-card">
              <div className="section-heading">
                <h3>Recent Documents</h3>
                <button onClick={() => setActiveTab("documents")}>
                  View All
                </button>
              </div>

              {loading ? (
                <p>Loading documents...</p>
              ) : (
                <DocumentList
                  documents={documents.slice(0, 5)}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                    setActiveTab("chat");
                  }}
                  onDelete={deleteDocument}
                />
              )}
            </section>
          </>
        )}

        {activeTab === "documents" && (
          <section className="content-card">
            <div className="section-heading">
              <h3>My Documents</h3>

              <button
                className="upload-btn"
                onClick={() => fileInput.current?.click()}
              >
                + Upload Document
              </button>
            </div>

            <DocumentList
              documents={documents}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={deleteDocument}
            />
          </section>
        )}

        {activeTab === "chat" && (
          <section className="feature-panel">
            <h3>✧ AI Document Assistant</h3>
            <p>Ask questions about your uploaded PDF.</p>

            <label>Select Document</label>

            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setChat([]);
              }}
            >
              <option value="">Choose a document</option>
              {documents.map((doc) => (
                <option
                  key={doc._id || doc.id}
                  value={doc._id || doc.id}
                >
                  {doc.title || doc.originalName}
                </option>
              ))}
            </select>

            <div className="chat-box">
              {chat.length === 0 && (
                <div className="empty-state">
                  <h3>Start a conversation</h3>
                  <p>Ask anything about your selected document.</p>
                </div>
              )}

              {chat.map((item, index) => (
                <div
                  key={index}
                  className={`chat-message ${item.role}`}
                >
                  <strong>
                    {item.role === "user" ? "You" : "NEXORA AI"}
                  </strong>
                  <p>{renderValue(item.content)}</p>
                </div>
              ))}

              {chatLoading && <p>AI is thinking...</p>}
              <div ref={chatEnd} />
            </div>

            <form className="chat-input-area" onSubmit={askAI}>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask your question..."
                disabled={chatLoading}
              />

              <button type="submit" disabled={chatLoading || !selectedId}>
                {chatLoading ? "Thinking..." : "Send ➤"}
              </button>
            </form>
          </section>
        )}

        {activeTab === "summary" && (
          <section className="feature-panel">
            <h3>☷ AI Document Summary</h3>
            <p>Generate an intelligent summary of your document.</p>

            <label>Select Document</label>

            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Choose a document</option>
              {documents.map((doc) => (
                <option
                  key={doc._id || doc.id}
                  value={doc._id || doc.id}
                >
                  {doc.title || doc.originalName}
                </option>
              ))}
            </select>

            <button
              className="primary-btn"
              onClick={generateSummary}
              disabled={summaryLoading || !selectedId}
            >
              {summaryLoading ? "Generating..." : "✧ Generate Summary"}
            </button>

            {summary && (
              <div className="result-card">
                <h3>Generated Summary</h3>
                <div className="result-content">
                  {renderValue(summary)}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "analyzer" && (
          <section className="feature-panel">
            <h3>◈ AI Resume Analyzer</h3>
            <p>
              Analyze your resume and receive personalized career feedback.
            </p>

            <label>Select Resume</label>

            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Choose your resume</option>
              {documents.map((doc) => (
                <option
                  key={doc._id || doc.id}
                  value={doc._id || doc.id}
                >
                  {doc.title || doc.originalName}
                </option>
              ))}
            </select>

            <label>Target Job Role</label>

            <input
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="MERN Stack Developer"
            />

            <button
              className="primary-btn"
              onClick={analyzeResume}
              disabled={analysisLoading || !selectedId}
            >
              {analysisLoading
                ? "Analyzing Resume..."
                : "✧ Analyze My Resume"}
            </button>

            {analysis && (
              <ResumeAnalysisResult analysis={analysis} />
            )}
          </section>
        )}

        <footer className="app-footer">
          NEXORA AI | Intelligent Document Workspace
        </footer>
      </main>

      <input
        ref={fileInput}
        type="file"
        accept=".pdf,application/pdf"
        hidden
        onChange={uploadDocument}
      />
    </div>
  );
}

// Resume Analysis Result
function ResumeAnalysisResult({ analysis }) {
  if (typeof analysis === "string") {
    return (
      <div className="analysis-result">
        <h3>✧ Your AI Resume Analysis</h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{analysis}</p>
      </div>
    );
  }

  if (!analysis || typeof analysis !== "object") {
    return <p>No resume analysis received.</p>;
  }

  const score = Number(
    analysis.score ?? analysis.totalScore ?? analysis.overallScore ?? 0
  );

  const breakdown = analysis.scoreBreakdown || {};

  const sections = [
    ["Verified Skills", analysis.verifiedSkills],
    ["Strengths", analysis.strengths],
    ["Areas for Improvement", analysis.areasForImprovement],
    ["Recommended Skills", analysis.recommendedSkills],
    ["Action Plan", analysis.actionPlan],
    ["Project Feedback", analysis.projectFeedback]
  ];

  return (
    <div className="analysis-result">
      <div className="section-heading">
        <h3>✧ Your AI Resume Analysis</h3>
        <span className="score-badge">{score}/100</span>
      </div>

      <button
        type="button"
        className="download-pdf-btn"
        onClick={() => downloadResumeAnalysisPDF(analysis)}
      >
        📄 Download Analysis PDF
      </button>

      <div className="score-card">
        <h2>{score}/100</h2>
        <p>Resume Evaluation Score</p>

        <div className="score-track">
          <div
            className="score-fill"
            style={{
              width: `${Math.min(100, Math.max(0, score))}%`
            }}
          />
        </div>

        <small>
          Project-generated evaluation, not an official ATS score.
        </small>
      </div>

      {Object.keys(breakdown).length > 0 && (
        <div className="analysis-section">
          <h3>Score Breakdown</h3>

          <div className="breakdown-grid">
            {Object.entries(breakdown).map(([key, value]) => (
              <div className="stat-card" key={key}>
                <h4>{formatLabel(key)}</h4>
                {renderValue(value)}
              </div>
            ))}
          </div>
        </div>
      )}

      {sections.map(([heading, items]) => {
        if (
          items === undefined ||
          items === null ||
          (Array.isArray(items) && items.length === 0)
        ) {
          return null;
        }

        return (
          <div className="analysis-section" key={heading}>
            <h3>{heading}</h3>
            {renderValue(items)}
          </div>
        );
      })}
    </div>
  );
}

// Document List
function DocumentList({
  documents,
  selectedId,
  onSelect,
  onDelete
}) {
  if (!documents || documents.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Documents Found</h3>
        <p>Upload a PDF document to get started.</p>
      </div>
    );
  }

  return (
    <div className="document-grid">
      {documents.map((doc) => {
        const id = doc._id || doc.id;

        return (
          <div
            className={`document-card ${
              String(selectedId) === String(id)
                ? "document-selected"
                : ""
            }`}
            key={id}
          >
            <div className="document-icon">PDF</div>

            <div className="document-info">
              <h4>{doc.title || doc.originalName || "PDF Document"}</h4>
              <small>
                {doc.originalName || "Uploaded document"}
              </small>
              <p>
                {doc.createdAt
                  ? new Date(doc.createdAt).toLocaleDateString()
                  : ""}
              </p>
            </div>

            <div className="document-actions">
              <button
                type="button"
                onClick={() => onSelect(id)}
              >
                Select
              </button>

              <button
                type="button"
                className="delete-btn"
                onClick={() => onDelete(id)}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default App;
