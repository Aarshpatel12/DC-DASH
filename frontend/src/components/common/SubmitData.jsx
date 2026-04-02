import React, { useState } from "react";
import axios from "axios";

function SubmitData() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!sheetUrl) {
      setError("Please enter Google Sheet link");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:3000/submit-sheet",
        { sheetUrl }
      );

      setMessage(response.data.message || "Data submitted successfully!");
      setSheetUrl("");
    } catch (err) {
      setError("Failed to submit data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Submit Google Sheet</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Paste your Google Sheet link here..."
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #4e73df, #1cc88a)",
  },
  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "10px",
    width: "400px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  title: {
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    padding: "12px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#4e73df",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
  },
  success: {
    marginTop: "15px",
    color: "green",
  },
  error: {
    marginTop: "15px",
    color: "red",
  },
};

export default SubmitData;