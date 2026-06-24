import { auth } from "../firebase.js"; // Siguraduhing tama ang folder path mo papuntang firebase.js
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// const form = document.querySelector("form");

// form.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const btn = document.querySelector(".btn-reset");
//   const email = document.getElementById("resetEmail").value.trim();

//   try {
//     // 🔥 1. LOADING STATE: I-disable ang button para iwas spam-click
//     btn.disabled = true;
//     btn.innerText = "Sending link...";

//     // 🔥 2. FIREBASE SEND RESET EMAIL
//     await sendPasswordResetEmail(auth, email);

//     // Maganda magbigay ng malinaw na instruction sa user
//     alert("Password reset link sent! Please check your email inbox or spam folder.");
    
//     // 🔥 3. REDIRECT BALIK SA LOGIN PAGE
//     window.location.href = "../index.html"; // Palitan mo ito kung iba ang pangalan ng login file mo

//   } catch (error) {
//     console.error(error);
    
//     // Simpleng error handling para sa user
//     if (error.code === "auth/user-not-found") {
//         alert("This email is not registered in our system.");
//     } else {
//         alert(error.message);
//     }

//   } finally {
//     // 🔥 4. IBALIK SA DATI: Kapag natapos ang request o nag-error
//     btn.disabled = false;
//     btn.innerText = "Send Reset Link";
//   }
// });
const form = document.querySelector("form");
const resetButton = document.querySelector(".btn-reset");

// Dynamically inject a status container above the button for professional messaging
const statusDisplay = document.createElement("div");
statusDisplay.className = "reset-status-message";
statusDisplay.style.fontSize = "14px";
statusDisplay.style.marginBottom = "15px";
statusDisplay.style.textAlign = "center";
statusDisplay.style.display = "none"; // Hidden by default
resetButton.parentNode.insertBefore(statusDisplay, resetButton);

/**
 * Maps Firebase Auth error codes to user-friendly English messages.
 * @param {string} errorCode 
 * @returns {string}
 */
function getErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/user-not-found":
      return "This email address is not registered in our system.";
    case "auth/invalid-email":
      return "Invalid email format. Please check and try again.";
    case "auth/too-many-requests":
      return "Too many requests. Please wait a moment before trying again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      return "An unexpected error occurred. Please try again later.";
  }
}

// --- SUBMIT EVENT LISTENER ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("resetEmail").value.trim();

  // Reset status display on a new submission attempt
  statusDisplay.style.display = "none";
  statusDisplay.textContent = "";

  // Client-side validation guard
  if (!email) {
    statusDisplay.style.color = "#dc3545"; // Danger Red
    statusDisplay.textContent = "Please enter your email address.";
    statusDisplay.style.display = "block";
    return;
  }

  try {
    // 1. Loading State
    resetButton.disabled = true;
    resetButton.innerText = "Sending link...";

    // 2. Firebase Send Password Reset Email
    await sendPasswordResetEmail(auth, email);

    // 3. Success State
    statusDisplay.style.color = "#28a745"; // Success Green
    statusDisplay.textContent = "Password reset link sent! Check your inbox or spam folder.";
    statusDisplay.style.display = "block";


  } catch (error) {
    console.error("Password Reset Error:", error.code, error.message);
    
    // 4. Handle and display the specific error message
    statusDisplay.style.color = "#dc3545"; // Danger Red
    statusDisplay.textContent = getErrorMessage(error.code);
    statusDisplay.style.display = "block";

    // Re-enable button ONLY if it fails so they can fix the email and retry
    resetButton.disabled = false;
    resetButton.innerText = "Send Reset Link";
  }
});