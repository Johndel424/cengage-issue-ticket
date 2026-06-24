import { auth, db } from "../firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.querySelector(".btn-register");

  // Mas ligtas kunin gamit ang id o tamang selectors para hindi magkapalit-palit ang index
  const fullName = document.querySelector('input[placeholder="Juan Dela Cruz"]').value.trim();
  const email = document.querySelector('input[type="email"]').value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  
  // 🔥 PAGKUHA SA VALUE NG WORK ROLE DROPDOWN
  const workRole = document.getElementById("workRole").value;

  // Validation: Siguraduhing may piniling work role
  if (!workRole) {
    alert("Please select a work role!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    btn.disabled = true;
    btn.innerText = "Creating account...";

    // 🔥 1. CREATE AUTH USER
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 🔥 2. SAVE TO REALTIME DB (Kasama na ang workRole)
    await set(ref(db, "users/" + user.uid), {
      uid: user.uid,
      fullName: fullName,
      email: email,
      workRole: workRole // Idinagdag dito sa database payload
    });

    alert("Account created successfully!");
    
    // 🔥 3. REDIRECT SA MAIN.HTML KAPAG SUCCESSFUL
   window.location.href = "../main/main.html";

  } catch (error) {
    console.error(error);
    alert(error.message);

  } finally {
    btn.disabled = false;
    btn.innerText = "Create Account";
  }
});

// --- ITONG SEKSYON NA ITO AY PARA SA TEXT TOGGLE (SHOW/HIDE) NG PASSWORD ---
function setupPasswordToggle(inputFieldId, buttonId) {
    const inputField = document.getElementById(inputFieldId);
    const toggleButton = document.getElementById(buttonId);

    if (inputField && toggleButton) {
        toggleButton.addEventListener('click', function () {
            const isPassword = inputField.getAttribute('type') === 'password';
            inputField.setAttribute('type', isPassword ? 'text' : 'password');
            this.textContent = isPassword ? 'HIDE' : 'SHOW';
        });
    }
}

setupPasswordToggle('password', 'togglePasswordFirst');
setupPasswordToggle('confirmPassword', 'togglePassword');
