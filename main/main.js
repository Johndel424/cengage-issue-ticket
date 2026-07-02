import { auth, db } from "../firebase.js";
import { onAuthStateChanged,signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { ref, get, push, set , onValue } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


// Hulaan ang mga HTML elements
const userAvatar = document.getElementById("userAvatar");
const userFullName = document.getElementById("userFullName");
const userRole = document.getElementById("userRole");

// DOM Elements
const ticketForm = document.getElementById("ticketForm");
const contentSetSelect = document.getElementById("ticketContentSet");
const assignToSelect = document.getElementById("assignTo");
// Siguraduhing nakuha mo itong mga bagong elements sa itaas ng JS file mo:
const csEngineerGroup = document.getElementById("csEngineerGroup");
const csAnalystGroup = document.getElementById("csAnalystGroup");
const csEngineerDisplay = document.getElementById("csEngineerDisplay");
const csAnalystDisplay = document.getElementById("csAnalystDisplay");
// Global Data Holders
let currentUserData = null;
let globalUsersData = {};
let globalContentSetsData = {};

// 1. WATCH USER AUTHENTICATION & INITIALIZE DATA
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userRef = ref(db, "users/" + user.uid);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                currentUserData = snapshot.val();
                
                const fullName = currentUserData.fullName || "User";
                const rawRole = currentUserData.workRole || "No Role";

                const formattedRole = rawRole
                    .split("-")
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                const initial = fullName.charAt(0).toUpperCase();

                if (typeof userAvatar !== 'undefined') userAvatar.textContent = initial;
                if (typeof userFullName !== 'undefined') userFullName.textContent = fullName;
                if (typeof userRole !== 'undefined') userRole.textContent = formattedRole;

                await loadInitialData();
                listenToActiveTickets(user.uid);
            } else {
                console.log("No data available in database for this user.");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        window.location.href = "../index.html"; 
    }
});

// 2. REAL-TIME TICKET BADGE COUNTER
function listenToActiveTickets(userUid) {
    const ticketsRef = ref(db, "tickets");
    onValue(ticketsRef, (ticketsSnapshot) => {
        let myAssignedCount = 0;

        if (ticketsSnapshot.exists()) {
            const ticketsData = ticketsSnapshot.val();
            const ticketList = Object.values(ticketsData);

            ticketList.forEach((ticket) => {
                const isAssignedToMe = ticket.assignedTouid === userUid;
                const isCreatedByMe = ticket.createdByuid === userUid; 
                const isNotDone = ticket.status !== "Done"; 

                if ((isAssignedToMe || isCreatedByMe) && isNotDone) {
                    myAssignedCount++;
                }
            });
        }

        if (typeof assignedBadge !== 'undefined' && assignedBadge) {
            if (myAssignedCount > 0) {
                assignedBadge.textContent = myAssignedCount;
                assignedBadge.style.display = "inline-block";
            } else {
                assignedBadge.style.display = "none";
            }
        }
    });
}

// 3. FETCH USERS & CONTENT SETS FROM FIREBASE
async function loadInitialData() {
    try {
        const usersSnapshot = await get(ref(db, "users"));
        globalUsersData = usersSnapshot.exists() ? usersSnapshot.val() : {};

        const contentSetsSnapshot = await get(ref(db, "contentSets"));
        globalContentSetsData = contentSetsSnapshot.exists() ? contentSetsSnapshot.val() : {};

        if (contentSetSelect) {
            contentSetSelect.innerHTML = '<option value="none" selected>Not a content set</option>';
            Object.keys(globalContentSetsData).forEach(key => {
                contentSetSelect.innerHTML += `<option value="${key}">${globalContentSetsData[key].title}</option>`;
            });
        }

        loadAllQualifiedStaff();

    } catch (error) {
        console.error("Error loading initial dropdown data:", error);
    }
}

// 4. LOAD ALL QUALIFIED STAFF (KAPAG 'NONE' ANG CONTENT SET)
function loadAllQualifiedStaff() {
    if (!assignToSelect) return;
    
    assignToSelect.innerHTML = `
        <option value="" disabled selected>Select User</option>
        <option value="unassigned">Anyone (Open for Pickup)</option>
    `;

    Object.keys(globalUsersData).forEach((userId) => {
        const user = globalUsersData[userId];
        const role = user.workRole;

        if (role === "spinner-engineer" || role === "software-engineer" || role === "data-analyst") {
            const option = document.createElement("option");
            option.value = userId; 
            option.textContent = `${user.fullName} (${role === "data-analyst" ? "Data Analyst" : "Engineer"})`;
            assignToSelect.appendChild(option);
        }
    });
}

// 5. DYNAMIC SELECTION LOGIC & INFORMATIONAL DISPLAY
if (contentSetSelect) {

    contentSetSelect.addEventListener("change", (e) => {
    const selectedContentId = e.target.value;

    // 1. KAPAG "NONE" ANG PINILI SA CONTENT SET
    if (selectedContentId === "none") {
        // Itago ang mga fields at i-clear ang laman
        csEngineerGroup.style.display = "none";
        csAnalystGroup.style.display = "none";
        csEngineerDisplay.value = "";
        csAnalystDisplay.value = "";

        loadAllQualifiedStaff(); // Balik sa buong listahan
        return;
    }

    // 2. KAPAG MAY PILING CONTENT SET
    const contentSet = globalContentSetsData[selectedContentId];
    
    let assignedEngineerUid = "unassigned";
    let assignedAnalystUid = "unassigned";

    Object.keys(globalUsersData).forEach(uid => {
        if (globalUsersData[uid].fullName === contentSet.engineerName) assignedEngineerUid = uid;
        if (globalUsersData[uid].fullName === contentSet.dataAnalystName) assignedAnalystUid = uid;
    });

    // ISHOW SA MAAYOS NA STYLE GAMIT ANG MGA BAGONG INPUT FIELDS
    csEngineerGroup.style.display = "flex";
    csAnalystGroup.style.display = "flex";
    
    csEngineerDisplay.value = contentSet.engineerName || "None assigned";
    csAnalystDisplay.value = contentSet.dataAnalystName || "None assigned";

    // I-filter ang Assign To choices (Silang dalawa lang + Open for Pickup)
    assignToSelect.innerHTML = `
        <option value="" disabled selected>Select from Content Set Staff</option>
    `;

    if (contentSet.engineerName && assignedEngineerUid !== "unassigned") {
        const opt = document.createElement("option");
        opt.value = assignedEngineerUid;
        opt.textContent = `${contentSet.engineerName}`;
        assignToSelect.appendChild(opt);
    }

    if (contentSet.dataAnalystName && assignedAnalystUid !== "unassigned") {
        const opt = document.createElement("option");
        opt.value = assignedAnalystUid;
        opt.textContent = `${contentSet.dataAnalystName}`;
        assignToSelect.appendChild(opt);
    }
});
}

// 6. HELPER FUNCTION: TICKET ID GENERATOR
function generateTicketNumber() {
    const lettersAndNumbers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const numbers = "0123456789";
    
    let middlePart = "";
    for (let i = 0; i < 3; i++) {
        middlePart += lettersAndNumbers.charAt(Math.floor(Math.random() * lettersAndNumbers.length));
    }
    
    let lastPart = "";
    for (let i = 0; i < 4; i++) {
        lastPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return `TKT-${middlePart}-${lastPart}`;
}

// 7. FORM SUBMISSION EVENT LISTENER (UPDATED WITH AUTOMATIC CONTENT SET STAFF IN DATABASE)
if (ticketForm) {
    ticketForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!currentUserData) {
            alert("User session not loaded completely. Please try again.");
            return;
        }

        const submitBtn = document.querySelector(".submit-btn");
        
        const title = document.getElementById("ticketTitle").value.trim();
        const description = document.getElementById("ticketDescription").value.trim();
        const priority = document.getElementById("ticketPriority").value;
        const selectedContentSetId = contentSetSelect ? contentSetSelect.value : "none";
        
        const assignedToId = assignToSelect.value;
        const assignedToName = assignToSelect.options[assignToSelect.selectedIndex].text;

        // Kuhanin ang detalye ng Content Set para sa DB insertion
        let contentSetTitle = "None";
        let contentSetEngineer = "None";
        let contentSetAnalyst = "None";
        let contentSetEngineerId = "None";
        let contentSetAnalystId = "None";

        if (selectedContentSetId !== "none" && globalContentSetsData[selectedContentSetId]) {
            const currentCS = globalContentSetsData[selectedContentSetId];
            contentSetTitle = currentCS.title;
            contentSetEngineer = currentCS.engineerName ;
            contentSetAnalyst = currentCS.dataAnalystName;
            contentSetAnalystId = currentCS.dataAnalystId;
            contentSetEngineerId = currentCS.engineerId; 
        }

        const ticketStatus = (assignedToId === "unassigned") ? "ToDo" : "In Progress";
        const ticketNumber = generateTicketNumber(); 

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = "Creating ticket...";

            const customTicketRef = ref(db, "tickets/" + ticketNumber);
            const creationDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });

            // 🔥 IPAPASOK NA SA DATABASE LAHAT NG KAILANGAN MO DITO:
            await set(customTicketRef, {
                ticketId: ticketNumber, 
                title: title,
                description: description,
                priority: priority,
                // Content Set Metadata na hiniling mo
                contentSetTitle: contentSetTitle,
                contentSetEngineer: contentSetEngineer, 
                contentSetAnalyst: contentSetAnalyst,   
                contentSetEngineerId: contentSetEngineerId,
                contentSetAnalystId: contentSetAnalystId,
                // Assigned Staff Info
                assignedTouid: assignedToId,
                assignedToname: assignedToName,
                
                // Creator Info
                createdByuid: auth.currentUser.uid,
                createdByname: currentUserData.fullName,
                createdAt: creationDate,
                status: ticketStatus
            });

            alert(`Ticket [${ticketNumber}] created successfully with status: ${ticketStatus}`);
            
            ticketForm.reset(); 
            loadAllQualifiedStaff();

        } catch (error) {
            console.error("Error creating ticket:", error);
            alert("Failed to create ticket: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "Create Ticket";
        }
    });
}

/////////////////////////////////////////////
// SHOWING DATA IN LIST
// 1. DOM Elements selection
const todoContainer = document.getElementById("todoContainer");
const progressContainer = document.getElementById("progressContainer");
const doneContainer = document.getElementById("doneContainer");
const loadingOverlay = document.getElementById("loadingOverlay");

// Stats Elements
const statTotal = document.getElementById("statTotal");
const statTodo = document.getElementById("statTodo");
const statProgress = document.getElementById("statProgress");
const statDone = document.getElementById("statDone");

// Map para sa kulay ng priority badge
const badgeColors = {
    "Low": "green",
    "Medium": "orange",
    "High": "red",
    "Critical": "red"
};

// Pakinggan ang "tickets" node sa Realtime Database (ISANG ONVALUE LANG)
const ticketsRef = ref(db, "tickets");

onValue(ticketsRef, (snapshot) => {
    // Linisin muna ang mga container para hindi magdoble-doble ang HTML
    todoContainer.innerHTML = "";
    progressContainer.innerHTML = "";
    doneContainer.innerHTML = "";

    // Magsimula sa zerong counters para sa stats at checking
    let totalCount = 0;
    let todoCount = 0;
    let progressCount = 0;
    let doneCount = 0;

    if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Convert ang object sa array at i-reverse (LATEST ON TOP)
        // const ticketList = Object.values(data).reverse();
        // 1. Gawing Array ang data mula sa Firebase
        let ticketList = Object.values(data);

        // May antas o bigat ang bawat priority para sa pag-sort
        const priorityWeight = {
            "Critical": 4,
            "High": 3,
            "Medium": 2,
            "Low": 1
        };

        // 🔥 2. ANG SORTING ALGORITHM (High sa Taas, Low sa Baba. Pag parehas, pinakabago sa itaas)
        ticketList.sort((a, b) => {
    let weightA = priorityWeight[a.priority] || 1;
    let weightB = priorityWeight[b.priority] || 1;

    if (weightB !== weightA) {
        return weightB - weightA; 
    } else {
        const dateA = a.createdAt ? String(a.createdAt) : "";
        const dateB = b.createdAt ? String(b.createdAt) : "";
        
        if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
        } else {
            // Safety fallback: Kung sakaling maging pati eksaktong segundo ay parehas, gamitin ang ID (Luma sa taas)
            return String(a.ticketId).localeCompare(String(b.ticketId));
        }
    }
});
        totalCount = ticketList.length;

        ticketList.forEach((ticket) => {
            // Kuhanin ang default values base sa priority galing sa database
            let ticketClass = ticket.priority ? ticket.priority.toLowerCase() : "low";
            let badgeColor = badgeColors[ticket.priority] || "green";
            let badgeText = ticket.priority || "Low";
            
            let formattedDate = "No Date";
            if (ticket.createdAt) {
                // KUNG STRING ANG FORMAT SA FIREBASE (Halimbawa: "2026-06-23 16:22:23" o "June 23, 2026, 4:22 PM")
                // Puputulin lang natin ito sa unang space o comma gamit ang split
                formattedDate = ticket.createdAt.split(' ')[0]; 
                
                // ALTERNATIBO: Kung gusto mo ng mas magandang format (Format: MM/DD/YYYY)
                const d = new Date(ticket.createdAt);
                formattedDate = d.toLocaleDateString(); 
            }
            // 🔥 DITO ANG LIMITASYON (Kapag sumobra sa 25 letters, puputulin at lalagyan ng '...')
            const originalTitle = ticket.title || ""; 
            const shortTitle = originalTitle.length > 25 
                ? originalTitle.substring(0, 25) + "..." 
                : originalTitle;
            const originalName = ticket.createdByname || "User";
            const shortName = originalName.length > 15 
                ? originalName.substring(0, 15) + "..." 
                : originalName;
            // Logika para sa kulay ng ticket border/card base sa status
            if (ticket.status === "ToDo") {
                ticketClass = "high";
            } else if (ticket.status === "In Progress") {
                ticketClass = "medium"; 
            } else if (ticket.status === "Done") {
                ticketClass = "low";
            }

            const ticketHTML = `
                <div class="ticket ${ticketClass}" onclick="location.href='main-details.html?id=${ticket.ticketId}'">
                    <div class="ticket-meta-grid">
                        <div class="meta-item">
                            <span class="ticket-id">#${ticket.ticketId}</span>
                        </div>
                        <div class="meta-item text-right">
                            <span class="meta-label">Created at:</span>
                            <span class="meta-value date-text">${formattedDate}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">By:</span>
                            <span class="meta-value">${shortName}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">To:</span>
                            <span class="meta-value">${ticket.assignedToname || 'Unassigned'}</span>
                        </div>
                    </div>

                    <div class="ticket-footer">
                        <h3 class="ticket-title" title="${originalTitle}">${shortTitle}</h3>
                        <span class="badge ${badgeColor}">${badgeText}</span>
                    </div>
                </div>
            `;

            // I-sort sa tamang column at magdagdag sa kaukulang counter
            if (ticket.status === "ToDo") {
                todoContainer.insertAdjacentHTML("beforeend", ticketHTML);
                todoCount++;
            } else if (ticket.status === "In Progress") {
                progressContainer.insertAdjacentHTML("beforeend", ticketHTML);
                progressCount++;
            } else if (ticket.status === "Done") {
                doneContainer.insertAdjacentHTML("beforeend", ticketHTML);
                doneCount++;
            }
        });
    }

    // Tiyaking may "No tasks..." placeholder kapag walang pumasok na ticket sa column
    if (todoCount === 0) {
        todoContainer.innerHTML = "<p class='no-tickets'>No tasks inside To Do</p>";
    }
    if (progressCount === 0) {
        progressContainer.innerHTML = "<p class='no-tickets'>No tasks in progress</p>";
    }
    if (doneCount === 0) {
        doneContainer.innerHTML = "<p class='no-tickets'>No completed tasks</p>";
    }

    // I-update ang mga text elements ng stats sa dashboard
    if (statTotal) statTotal.textContent = totalCount;
    if (statTodo) statTodo.textContent = todoCount;
    if (statProgress) statProgress.textContent = progressCount;
    if (statDone) statDone.textContent = doneCount;

    // Itago ang loading overlay kapag tapos nang maproseso ang data
    if (loadingOverlay) {
        loadingOverlay.style.display = "none";
    }
});















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