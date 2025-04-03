import React, { useState } from "react";
import { gapi } from "gapi-script";

export default function EmailAITester() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState("Professional");

  const API_KEY = ""; // 🔹 Replace with your OpenAI API Key
  const API_URL = "https://api.openai.com/v1/chat/completions";

  const fetchEmails = async () => {
    try {
      if (!gapi.client.gmail) {
        await gapi.client.load("gmail", "v1");
      }

      const response = await gapi.client.gmail.users.messages.list({
        userId: "me",
        maxResults: 5, // Fetch last 5 emails
      });

      const messages = response.result.messages || [];

      if (!messages.length) {
        setEmails([]);
        return;
      }

      const emailList = await Promise.all(
        messages.map(async (msg) => {
          const msgData = await gapi.client.gmail.users.messages.get({
            userId: "me",
            id: msg.id,
          });

          const headers = msgData.result.payload.headers;
          const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
          const from = headers.find((h) => h.name === "From")?.value || "Unknown Sender";

          let body = "No content available";
          if (msgData.result.payload.parts) {
            const textPart = msgData.result.payload.parts.find(part => part.mimeType === "text/plain");
            if (textPart && textPart.body && textPart.body.data) {
              body = atob(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"));
            }
          } else if (msgData.result.payload.body && msgData.result.payload.body.data) {
            body = atob(msgData.result.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          }

          return { from, subject, body };
        })
      );

      setEmails(emailList);
    } catch (error) {
      console.error("Error fetching emails:", error);
    }
  };

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
    setResponse(""); // Reset response
  };

  const handleAIRequest = async (type) => {
    if (!selectedEmail) {
      alert("Please select an email first.");
      return;
    }

    setLoading(true);
    setResponse("");

    let prompt = "";

    switch (type) {
      case "summarize":
        prompt = `Summarize this email: "${selectedEmail.body}"`;
        break;
      case "reply":
        prompt = `Write a professional reply to this email: "${selectedEmail.body}"`;
        break;
      case "draft":
        prompt = `Draft a new email with the following intent: "${selectedEmail.body}"`;
        break;
      case "tone":
        prompt = `Rewrite this email in a more ${tone} tone: "${selectedEmail.body}"`;
        break;
      default:
        return;
    }

    const requestBody = {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      setResponse(data.choices?.[0]?.message?.content || "No response available.");
    } catch (error) {
      console.error("Error:", error);
      setResponse("Error processing the request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mt-4">Inbox Emails</h2>
      <button onClick={fetchEmails} className="px-4 py-2 bg-blue-500 text-white rounded">
        Fetch Inbox Emails
      </button>

      {emails.length > 0 ? (
        <ul>
          {emails.map((email, index) => (
            <li
              key={index}
              className={`p-2 border cursor-pointer ${
                selectedEmail === email ? "bg-gray-300" : "bg-white"
              }`}
              onClick={() => handleEmailSelect(email)}
            >
              <strong>From:</strong> {email.from} <br />
              <strong>Subject:</strong> {email.subject}
            </li>
          ))}
        </ul>
      ) : (
        <p>No emails found.</p>
      )}

      {selectedEmail && (
        <div className="mt-4">
          <h3 className="text-lg font-bold">Selected Email</h3>
          <p><strong>From:</strong> {selectedEmail.from}</p>
          <p><strong>Subject:</strong> {selectedEmail.subject}</p>
          <p><strong>Body:</strong> {selectedEmail.body}</p>

          {/* AI Buttons */}
          <div className="mt-4 flex gap-2">
            <button onClick={() => handleAIRequest("summarize")} className="px-4 py-2 bg-blue-500 text-white rounded">
              Summarize Email
            </button>
            <button onClick={() => handleAIRequest("reply")} className="px-4 py-2 bg-green-500 text-white rounded">
              AI Reply
            </button>
            <button onClick={() => handleAIRequest("draft")} className="px-4 py-2 bg-yellow-500 text-white rounded">
              Draft Email
            </button>
          </div>

          <div className="mt-4">
            <label>Select Tone:</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
            </select>
            <button onClick={() => handleAIRequest("tone")} className="px-4 py-2 bg-purple-500 text-white rounded ml-2">
              Adjust Tone
            </button>
          </div>
        </div>
      )}

      {loading && <p className="mt-4">Processing...</p>}
      {response && <div className="mt-4">{response}</div>}
    </div>
  );
}
