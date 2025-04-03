import React, { useEffect, useState } from "react";
import { gapi } from "gapi-script";
import EmailAITester from "./EmailAITester"; // Import the Email Assistant UI

const CLIENT_ID = ""; // Your OAuth Client ID

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    function start() {
      gapi.load("client:auth2", () => {
        gapi.client.init({
          clientId: CLIENT_ID,
          scope: "https://www.googleapis.com/auth/gmail.readonly",
        }).then(() => {
          if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
            setIsSignedIn(true);
          }
        }).catch(error => console.error("GAPI Initialization Error:", error));
      });
    }
    start();
  }, []);
  

  const handleSignIn = () => {
    gapi.auth2.getAuthInstance().signIn()
      .then(() => setIsSignedIn(true))
      .catch(error => console.error("Sign-in Error:", error));
  };

  const handleSignOut = () => {
    gapi.auth2.getAuthInstance().signOut()
      .then(() => setIsSignedIn(false))
      .catch(error => console.error("Sign-out Error:", error));
  };

  return (
    <div className="App">
      <h1>AI Email Assistant</h1>
      {!isSignedIn ? (
        <button onClick={handleSignIn}>Sign in with Google</button>
      ) : (
        <>
          <button onClick={handleSignOut}>Sign Out</button>
          <EmailAITester /> {/* Load Email Inbox UI after signing in */}
        </>
      )}
    </div>
  );
}
