import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import "./App.css";

const API_URL = "http://localhost:8080/api";
const WS_URL = "ws://localhost:8080/ws";

// Define the Question Type
interface Question {
  _id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null,
  );

  // 1. Not logged in -> Show Auth
  if (!token || !userId) {
    return (
      <Auth
        onAuthSuccess={(t, u) => {
          setToken(t);
          setUserId(u);
        }}
      />
    );
  }

  // 2. Logged in, but no question selected -> Show Dashboard
  if (!selectedQuestion) {
    return (
      <Dashboard
        token={token}
        onSelectQuestion={setSelectedQuestion}
        onLogout={() => {
          setToken(null);
          setUserId(null);
        }}
      />
    );
  }

  // 3. Question selected -> Show Code Editor Workspace
  return (
    <Workspace
      token={token}
      userId={userId}
      question={selectedQuestion}
      onBack={() => setSelectedQuestion(null)}
      onLogout={() => {
        setToken(null);
        setUserId(null);
        setSelectedQuestion(null);
      }}
    />
  );
}

// ==========================================
// 1. AUTH COMPONENT
// ==========================================
interface AuthProps {
  onAuthSuccess: (token: string, userId: string) => void;
}

function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email, password }
        : { username, email, password };

      const res = await axios.post(`${API_URL}${endpoint}`, payload);

      if (isLogin) {
        onAuthSuccess(res.data.token, res.data.userId);
      } else {
        setIsLogin(true);
        alert("Registered successfully! Please log in.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Authentication failed");
    }
  };

  return (
    <div
      style={{
        padding: "50px",
        maxWidth: "400px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <h2>{isLogin ? "Login to Online Judge" : "Create an Account"}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        {!isLogin && (
          <input
            placeholder="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: "10px" }}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "10px" }}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "10px" }}
        />

        <button
          type="submit"
          style={{
            padding: "10px",
            backgroundColor: "#2cbb5d",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {isLogin ? "Login" : "Register"}
        </button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        style={{
          marginTop: "15px",
          background: "none",
          border: "none",
          color: "#2cbb5d",
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        {isLogin
          ? "Need an account? Register"
          : "Already have an account? Login"}
      </button>
    </div>
  );
}

// ==========================================
// 2. DASHBOARD COMPONENT (Question List)
// ==========================================
interface DashboardProps {
  token: string;
  onSelectQuestion: (q: Question) => void;
  onLogout: () => void;
}

function Dashboard({ token, onSelectQuestion, onLogout }: DashboardProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(`${API_URL}/questions`, {
          headers: { Authorization: `Bearer ${token}` }, // Good practice to secure it
        });
        setQuestions(res.data);
      } catch (err) {
        console.error("Failed to fetch questions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1e1e1e",
        color: "#fff",
        fontFamily: "sans-serif",
        padding: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        <h1 style={{ margin: 0 }}>Problem Set</h1>
        <button
          onClick={onLogout}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            backgroundColor: "#444",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Logout
        </button>
      </div>

      {loading ? (
        <p>Loading problems...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {questions.map((q) => (
            <div
              key={q._id}
              onClick={() => onSelectQuestion(q)}
              style={{
                backgroundColor: "#2d2d2d",
                padding: "20px",
                borderRadius: "8px",
                cursor: "pointer",
                border: "1px solid #444",
                transition: "transform 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "translateY(-3px)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <h3 style={{ margin: "0 0 10px 0" }}>{q.title}</h3>
              <span
                style={{
                  backgroundColor:
                    q.difficulty === "Easy"
                      ? "#2cbb5d"
                      : q.difficulty === "Medium"
                        ? "#f1c40f"
                        : "#ef4743",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                }}
              >
                {q.difficulty}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. WORKSPACE COMPONENT (Pro UI)
// ==========================================
interface WorkspaceProps {
  token: string;
  userId: string;
  question: Question;
  onBack: () => void;
  onLogout: () => void;
}

interface WsMessage {
  userId: string;
  submissionId: string;
  status: string;
  output: string;
}

function Workspace({
  token,
  userId,
  question,
  onBack,
  onLogout,
}: WorkspaceProps) {
  // Setup the default code exactly as requested
  const defaultCode = `const fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim();\n\n// Write your logic below:\n`;

  const [code, setCode] = useState<string>(defaultCode);
  const [status, setStatus] = useState<string>("Idle");
  const [output, setOutput] = useState<string>("");
  const ws = useRef<WebSocket | null>(null);

  // WebSocket connection
  useEffect(() => {
    ws.current = new WebSocket(`${WS_URL}?userId=${userId}`);
    ws.current.onopen = () => console.log("WebSocket Connected! 🔌");
    ws.current.onmessage = (event: MessageEvent) => {
      const data: WsMessage = JSON.parse(event.data);
      setStatus(data.status);
      setOutput(data.output);
    };
    return () => {
      if (ws.current) ws.current.close();
    };
  }, [userId]);

  const handleSubmit = async () => {
    setStatus("Pending...");
    setOutput("Executing remotely in Docker...");

    try {
      await axios.post(
        `${API_URL}/submissions`,
        {
          questionId: question._id,
          language: "javascript",
          code: code,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (err) {
      console.error(err);
      setStatus("Error submitting code");
      setOutput("Failed to reach server.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#1e1e1e",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      {/* NAVBAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "#2d2d2d",
          borderBottom: "1px solid #444",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "#aaa",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ← Back to Problems
          </button>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Online Judge</h2>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: "5px 15px",
            cursor: "pointer",
            backgroundColor: "#444",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Logout
        </button>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* LEFT PANEL: Question Details */}
        <div
          style={{
            flex: 1,
            padding: "30px",
            borderRight: "1px solid #444",
            overflowY: "auto",
          }}
        >
          <h1 style={{ fontSize: "1.8rem", marginBottom: "10px" }}>
            {question.title}
          </h1>
          <span
            style={{
              backgroundColor:
                question.difficulty === "Easy"
                  ? "#2cbb5d"
                  : question.difficulty === "Medium"
                    ? "#f1c40f"
                    : "#ef4743",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.8rem",
              fontWeight: "bold",
            }}
          >
            {question.difficulty}
          </span>
          <p
            style={{
              marginTop: "30px",
              fontSize: "1.1rem",
              lineHeight: "1.6",
              color: "#ccc",
              whiteSpace: "pre-wrap",
            }}
          >
            {question.description}
          </p>
        </div>

        {/* RIGHT PANEL: Editor & Output */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* EDITOR SECTION */}
          <div style={{ flex: 2, position: "relative", paddingTop: "10px" }}>
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{ minimap: { enabled: false }, fontSize: 16 }}
            />
            <button
              onClick={handleSubmit}
              disabled={status === "Pending..."}
              style={{
                position: "absolute",
                bottom: "15px",
                right: "15px",
                padding: "10px 20px",
                fontSize: "1rem",
                fontWeight: "bold",
                backgroundColor: "#2cbb5d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: status === "Pending..." ? "not-allowed" : "pointer",
                zIndex: 10,
              }}
            >
              {status === "Pending..." ? "Running..." : "Run Code"}
            </button>
          </div>

          {/* OUTPUT SECTION */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#1e1e1e",
              borderTop: "1px solid #444",
              padding: "15px",
              overflowY: "auto",
            }}
          >
            <h3
              style={{ margin: "0 0 10px 0", fontSize: "1rem", color: "#aaa" }}
            >
              Execution Result:
              <span
                style={{
                  marginLeft: "10px",
                  color:
                    status === "Accepted"
                      ? "#2cbb5d"
                      : status === "Wrong Answer" ||
                          status === "Compilation Error"
                        ? "#ef4743"
                        : "#f1c40f",
                }}
              >
                {status}
              </span>
            </h3>
            <pre
              style={{
                backgroundColor: "#000",
                padding: "15px",
                borderRadius: "4px",
                color: "#00ff00",
                minHeight: "80px",
                margin: 0,
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
              }}
            >
              {output || "> Submit code to see output..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
