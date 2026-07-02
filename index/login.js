import { auth } from "../firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// const form = document.querySelector("form");

// form.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const btn = document.querySelector(".btn-login");
//   const email = document.getElementById("loginEmail").value.trim();
//   const password = document.getElementById("loginPassword").value;

//   try {
//     // 🔥 1. LOADING STATE: I-disable ang button at palitan ang text
//     btn.disabled = true;
//     btn.innerText = "Logging in...";

//     // 🔥 2. FIREBASE SIGN IN
//     await signInWithEmailAndPassword(auth, email, password);

//     alert("Login successful!");
    
//     // 🔥 3. REDIRECT SA MAIN.HTML KAPAG SUCCESSFUL
//     window.location.href = "main/main.html";

//   } catch (error) {
//     console.error(error);
//     // Mas magandang linisin ang error message para sa user (opsyonal)
//     alert(error.message);

//   } finally {
//     // 🔥 4. IBALIK SA DATI: Kapag natapos o nagka-error, ibalik ang button sa normal
//     btn.disabled = false;
//     btn.innerText = "Login";
//   }
// });
const form = document.querySelector("form");
const loginButton = document.querySelector(".btn-login");

// Dynamically inject an error container above the login button for clean UI integration
const errorDisplay = document.createElement("div");
errorDisplay.className = "login-error-message";
errorDisplay.style.color = "#dc3545"; // Standard Bootstrap bootstrap danger red
errorDisplay.style.fontSize = "14px";
errorDisplay.style.marginBottom = "15px";
errorDisplay.style.textAlign = "center";
errorDisplay.style.display = "none"; // Hidden by default
loginButton.parentNode.insertBefore(errorDisplay, loginButton);

/**
 * Maps Firebase Auth error codes to user-friendly English messages.
 * @param {string} errorCode 
 * @returns {string}
 */
function getErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/user-not-found":
      return "This email address is not registered.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-email":
      return "Invalid email format (e.g., user@example.com).";
    case "auth/too-many-requests":
      return "Too many failed attempts. This account has been temporarily blocked.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      return "An unexpected error occurred. Please try again later.";
  }
}

// --- SUBMIT EVENT LISTENER ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  // Reset error display on new submission attempt
  errorDisplay.style.display = "none";
  errorDisplay.textContent = "";

  // Client-side validation guard to prevent unnecessary network requests
  if (!email || !password) {
    errorDisplay.textContent = "Please fill in all required fields.";
    errorDisplay.style.display = "block";
    return;
  }

  try {
    // 1. Loading State
    loginButton.disabled = true;
    loginButton.innerText = "Logging in...";

    // 2. Firebase Authentication
    await signInWithEmailAndPassword(auth, email, password);

    // 3. Redirect upon successful authentication
    window.location.href = "main/main.html";

  } catch (error) {
    console.error("Login Error:", error.code, error.message);
    
    // 4. Handle and display the localized error message
    errorDisplay.textContent = getErrorMessage(error.code);
    errorDisplay.style.display = "block";

  } finally {
    // 5. Re-enable button and restore original state
    loginButton.disabled = false;
    loginButton.innerText = "Login";
  }
});

    // --- ITONG SEKSYON NA ITO AY PARA SA TEXT TOGGLE (SHOW/HIDE) NG PASSWORD ---
const loginPasswordInput = document.getElementById('loginPassword');
const toggleLoginPasswordBtn = document.getElementById('toggleLoginPassword');

if (loginPasswordInput && toggleLoginPasswordBtn) {
    toggleLoginPasswordBtn.addEventListener('click', function () {
        const isPassword = loginPasswordInput.getAttribute('type') === 'password';
        loginPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
        this.textContent = isPassword ? 'HIDE' : 'SHOW';
    });
}