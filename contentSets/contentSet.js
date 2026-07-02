import { auth, db } from "../firebase.js";
import { onAuthStateChanged,signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { ref, get, push, set, update , onValue } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


// Hulaan ang mga HTML elements
const userAvatar = document.getElementById("userAvatar");
const userFullName = document.getElementById("userFullName");
const userRole = document.getElementById("userRole");


const engineerSelect = document.getElementById("engineerSelect");
const analystSelect = document.getElementById("analystSelect");

const usersRef = ref(db, "users");

onValue(usersRef, (snapshot) => {

    engineerSelect.innerHTML =
        '<option value="">Select Engineer</option>';

    analystSelect.innerHTML =
        '<option value="">Select Data Analyst</option>';

    snapshot.forEach((child) => {

        const uid = child.key;
        const user = child.val();

        if (user.workRole === "software-engineer") {
            engineerSelect.innerHTML += `
                <option value="${user.fullName}">
                    ${user.fullName}
                </option>
            `;
        }
        if (user.workRole === "data-analyst") {
            analystSelect.innerHTML += `
                <option value="${user.fullName}">
                    ${user.fullName}
                </option>
            `;
        }
    });
});

document.getElementById("contentSetForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const titleValue = document.getElementById("contentTitle").value.trim();
    if (!titleValue) { return alert("Please enter a title!"); }

    const safeContentId = titleValue.replace(/[\.\$\#\[\]\/]/g, "-");
    const contentRef = ref(db, `contentSets/${safeContentId}`);

    try {
        const snapshot = await get(contentRef);
        if (snapshot.exists()) {
            return alert("Error: This Title already exists!");
        }

        // Kunin ang mga HTML Elements ng Dropdown
        const engSelectEl = document.getElementById("engineerSelect");
        const anaSelectEl = document.getElementById("analystSelect");

        // Kunin ang napiling pangalan mula sa 'data-name' attribute ng napiling <option>
        const selectedEngName = engSelectEl.options[engSelectEl.selectedIndex]?.getAttribute("data-name") || "";
        const selectedAnaName = anaSelectEl.options[anaSelectEl.selectedIndex]?.getAttribute("data-name") || "";

        // Malinis na papasok sa database bilang magkakahiwalay na fields
        await set(contentRef, {
            title: titleValue,
            engineerId: engSelectEl.value,
            engineerName: selectedEngName,
            dataAnalystId: anaSelectEl.value,
            dataAnalystName: selectedAnaName,
            createdAt: Date.now()
        });

        alert("Content Set Saved!");
        document.getElementById("contentSetForm").reset();

    } catch (error) {
        console.error(error);
    }
});
const boardMain = document.querySelector(".board");

let engineersOptionsHTML = '<option value="">Select Engineer</option>';
let analystsOptionsHTML = '<option value="">Select Data Analyst</option>';

// 1. Fetch Users
onValue(ref(db, "users"), (snapshot) => {
    engineersOptionsHTML = '<option value="">Select Engineer</option>';
    analystsOptionsHTML = '<option value="">Select Data Analyst</option>';

    snapshot.forEach((child) => {
        const uid = child.key; // Ito ang totoong UID mula sa Firebase
        const user = child.val();

        // I-save ang uid sa 'value', at i-save ang pangalan sa 'data-name' attribute
        if (user.workRole === "software-engineer") {
            engineersOptionsHTML += `<option value="${uid}" data-name="${user.fullName}">${user.fullName}</option>`;
        }
        if (user.workRole === "data-analyst") {
            analystsOptionsHTML += `<option value="${uid}" data-name="${user.fullName}">${user.fullName}</option>`;
        }
    });
    
    // I-update din ang initial form dropdowns kung mayroon man sa page
    if (document.getElementById("engineerSelect")) document.getElementById("engineerSelect").innerHTML = engineersOptionsHTML;
    if (document.getElementById("analystSelect")) document.getElementById("analystSelect").innerHTML = analystsOptionsHTML;

    renderBoard();
});

// 2. Fetch Content Sets
let contentSetsData = {};
onValue(ref(db, "contentSets"), (snapshot) => {
    contentSetsData = snapshot.val() || {};
    renderBoard();
});

// 3. Dynamic and Responsive Rendering
function renderBoard() {
    boardMain.innerHTML = ""; 

    Object.keys(contentSetsData).forEach((contentId) => {
        const content = contentSetsData[contentId];

        const itemDiv = document.createElement("div");
        itemDiv.className = "content-item-card"; 

        itemDiv.innerHTML = `
            <h3>${content.title}</h3>
            
            <div class="form-group">
                <label>Engineer Assigned</label>
                <select class="update-engineer" data-id="${contentId}" data-current="${content.engineerId || ''}">
                    ${engineersOptionsHTML}
                </select>
            </div>
            
            <div class="form-group">
                <label>Data Analyst Assigned</label>
                <select class="update-analyst" data-id="${contentId}" data-current="${content.dataAnalystId || ''}">
                    ${analystsOptionsHTML}
                </select>
            </div>
        `;

        boardMain.appendChild(itemDiv);

        const engineerSelect = itemDiv.querySelector(".update-engineer");
        const analystSelect = itemDiv.querySelector(".update-analyst");

        // Dito, awtomatikong mapipili ang tamang option gamit ang naka-save na UID
        if (content.engineerId) engineerSelect.value = content.engineerId;
        if (content.dataAnalystId) analystSelect.value = content.dataAnalystId;

        // 4. Update para sa Engineer
        engineerSelect.addEventListener("change", async (e) => {
            const currentId = e.target.getAttribute("data-id");
            const previousValue = e.target.getAttribute("data-current");
            
            const newUid = e.target.value;
            // Kunin ang pangalan mula sa custom 'data-name' attribute ng piniling option
            const newName = e.target.options[e.target.selectedIndex]?.getAttribute("data-name") || "Nobody";
            
            const confirmAction = confirm(`Are you sure you want to reassign the Engineer for "${content.title}" to "${newName}"?`);
            
            if (confirmAction) {
                // Sabay na ia-update ang ID at Name sa Firebase
                await update(ref(db, `contentSets/${currentId}`), { 
                    engineerId: newUid,
                    engineerName: newUid ? newName : "" 
                });
                e.target.setAttribute("data-current", newUid); 
            } else {
                e.target.value = previousValue; 
            }
        });

        // 5. Update para sa Analyst
        analystSelect.addEventListener("change", async (e) => {
            const currentId = e.target.getAttribute("data-id");
            const previousValue = e.target.getAttribute("data-current");
            
            const newUid = e.target.value;
            const newName = e.target.options[e.target.selectedIndex]?.getAttribute("data-name") || "Nobody";

            const confirmAction = confirm(`Are you sure you want to reassign the Data Analyst for "${content.title}" to "${newName}"?`);

            if (confirmAction) {
                // Sabay na ia-update ang ID at Name sa Firebase
                await update(ref(db, `contentSets/${currentId}`), { 
                    dataAnalystId: newUid,
                    dataAnalystName: newUid ? newName : "" 
                });
                e.target.setAttribute("data-current", newUid);
            } else {
                e.target.value = previousValue; 
            }
        });
    });
}




//////////////////////////////////
// LOGOUT FUNCTION
// Kuhanin ang mga HTML elements
const logoutLink = document.getElementById('logoutLink');
const logoutModal = document.getElementById('logoutModal');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

// 1. Pag-click sa Logout link -> Lalabas ang Modal
logoutLink.addEventListener('click', function(event) {
    event.preventDefault(); // Pigilan ang pagtalon ng page
    logoutModal.style.display = 'flex'; // Ipakita ang modal
});

// 2. Pag-click sa Cancel button -> Tatago ang Modal
cancelLogoutBtn.addEventListener('click', function() {
    logoutModal.style.display = 'none';
});

// 3. Pag-click sa Labas ng modal (overlay) -> Tatago rin ang Modal
window.addEventListener('click', function(event) {
    if (event.target === logoutModal) {
        logoutModal.style.display = 'none';
    }
});

// 4. Pag-click sa Yes, Logout -> Dito na gagana si Firebase
confirmLogoutBtn.addEventListener('click', function() {
    signOut(auth)
        .then(() => {
            // Success! Ang Firebase na ang bahalang mag-clear ng session.
            alert("Logged out successfully!");
            window.location.href = "../index.html"; // I-redirect sa login page mo
        })
        .catch((error) => {
            // Kung may error man (halos madalang naman)
            console.error("Error signing out: ", error);
            alert("Something went wrong. Please try again.");
        });
});







const assignedToMeLink = document.getElementById("assignedToMeLink");

if (assignedToMeLink) {
  assignedToMeLink.addEventListener("click", function (e) {
    e.preventDefault(); // Pinipigilan ang '#' na mag-trigger sa URL
    window.location.href = "../main-assign/main-assign.html";
  });
}

const contentSets = document.getElementById("contentSets");

if (contentSets) {
  contentSets.addEventListener("click", function (e) {
    e.preventDefault(); // Pinipigilan ang '#' na mag-trigger sa URL
    window.location.href = "../contentSets/contentSet.html";
  });
}


const allTickets = document.getElementById("allTickets");

if (allTickets) {
  allTickets.addEventListener("click", function (e) {
    e.preventDefault(); // Pinipigilan ang '#' na mag-trigger sa URL
    window.location.href = "../main/main.html";
  });
}