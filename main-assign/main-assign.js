import { auth, db } from "../firebase.js";
import { onAuthStateChanged,signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { ref, get, push, set , onValue } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


// Hulaan ang mga HTML elements
const userAvatar = document.getElementById("userAvatar");
const userFullName = document.getElementById("userFullName");
const userRole = document.getElementById("userRole");

// Pakatitigan kung may naka-login na user
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // 1. Kunin ang data ng user mula sa Realtime DB gamit ang UID
      const userRef = ref(db, "users/" + user.uid);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        
        const fullName = userData.fullName || "User";
        const rawRole = userData.workRole || "No Role";

        // 2. I-format ang Work Role para mas magandang tingnan (e.g., "data-analyst" -> "Data Analyst")
        const formattedRole = rawRole
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        // 3. Kunin ang INITIAL (Unang titik ng Full Name, gawing Capital Letter)
        const initial = fullName.charAt(0).toUpperCase();

        // 4. I-display na sa HTML UI natin!
        userAvatar.textContent = initial;
        userFullName.textContent = fullName;
        userRole.textContent = formattedRole;

        const ticketsRef = ref(db, "tickets");
        onValue(ticketsRef, (ticketsSnapshot) => {
          let myAssignedCount = 0;

          if (ticketsSnapshot.exists()) {
            const ticketsData = ticketsSnapshot.val();
            const ticketList = Object.values(ticketsData);

            // ticketList.forEach((ticket) => {
            //   const isAssignedToMe = ticket.assignedTouid === user.uid;
            //   const isTaskActive = ticket.status === "ToDo" || ticket.status === "In Progress";

            //   if (isAssignedToMe && isTaskActive) {
            //     myAssignedCount++;
            //   }
            // });
            ticketList.forEach((ticket) => {
              // --- BINAGO DITO ---
              const isAssignedToMe = ticket.assignedTouid === user.uid;
              const isCreatedByMe = ticket.createdByuid === user.uid; // Tinitignan kung ikaw ang gumawa
              const isNotDone = ticket.status !== "Done"; // Tinitignan kung hindi pa Done ang status

              // Bilangin kung (Assigned sa'yo O Created mo) AT ang status ay hindi Done
              if ((isAssignedToMe || isCreatedByMe) && isNotDone) {
                myAssignedCount++;
              }
              // --------------------
            });
          }

          if (assignedBadge) {
            if (myAssignedCount > 0) {
              assignedBadge.textContent = myAssignedCount;
              assignedBadge.style.display = "inline-block";
            } else {
              assignedBadge.style.display = "none";
            }
          }
        });
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

const allTicketsLink = document.getElementById("allTicketsLink");

if (allTicketsLink) {
  allTicketsLink.addEventListener("click", function (e) {
    e.preventDefault(); // Pinipigilan ang '#' na mag-trigger sa URL
    window.location.href = "../main/main.html";
  });
}

// /////////////////////////////////////////////
// // SHOWING DATA IN LIST
// // 1. DOM Elements selection
// const todoContainer = document.getElementById("todoContainer");
// const progressContainer = document.getElementById("progressContainer");
// const doneContainer = document.getElementById("doneContainer");
// const loadingOverlay = document.getElementById("loadingOverlay");

// // Stats Elements
// const statTotal = document.getElementById("statTotal");
// const statTodo = document.getElementById("statTodo");
// const statProgress = document.getElementById("statProgress");
// const statDone = document.getElementById("statDone");

// // Map para sa kulay ng priority badge
// const badgeColors = {
//     "Low": "green",
//     "Medium": "orange",
//     "High": "red",
//     "Critical": "red"
// };

// // Pakinggan ang "tickets" node sa Realtime Database (ISANG ONVALUE LANG)
// const ticketsRef = ref(db, "tickets");

// onValue(ticketsRef, (snapshot) => {
//     // Linisin muna ang mga container para hindi magdoble-doble ang HTML
//     todoContainer.innerHTML = "";
//     progressContainer.innerHTML = "";
//     doneContainer.innerHTML = "";

//     // Magsimula sa zerong counters para sa stats at checking
//     let totalCount = 0;
//     let todoCount = 0;
//     let progressCount = 0;
//     let doneCount = 0;

//     if (snapshot.exists()) {
//         const data = snapshot.val();
        
//         // Convert ang object sa array at i-reverse (LATEST ON TOP)
//         // const ticketList = Object.values(data).reverse();
//         // 1. Gawing Array ang data mula sa Firebase
//         let ticketList = Object.values(data);

//         // May antas o bigat ang bawat priority para sa pag-sort
//         const priorityWeight = {
//             "Critical": 4,
//             "High": 3,
//             "Medium": 2,
//             "Low": 1
//         };

//         // 🔥 2. ANG SORTING ALGORITHM (High sa Taas, Low sa Baba. Pag parehas, pinakabago sa itaas)
//         ticketList.sort((a, b) => {
//     let weightA = priorityWeight[a.priority] || 1;
//     let weightB = priorityWeight[b.priority] || 1;

//     // 1. Unahin ang mas mataas ang Priority (Critical -> High -> Medium -> Low)
//     if (weightB !== weightA) {
//         return weightB - weightA; 
//     } else {
//         // 🔥 2. KUNG PAREHAS NG PRIORITY: Mas lumang petsa/oras ang mauuna sa itaas (Chronological)
//         // Ginagamit ang 'a' kumpara sa 'b' para ang mas maagang oras (e.g., 3pm) ang mauna kesa sa (4pm)
//         const dateA = a.createdAt ? String(a.createdAt) : "";
//         const dateB = b.createdAt ? String(b.createdAt) : "";
        
//         if (dateA !== dateB) {
//             return dateA.localeCompare(dateB);
//         } else {
//             // Safety fallback: Kung sakaling maging pati eksaktong segundo ay parehas, gamitin ang ID (Luma sa taas)
//             return String(a.ticketId).localeCompare(String(b.ticketId));
//         }
//     }
// });
//         totalCount = ticketList.length;

//         ticketList.forEach((ticket) => {
//             // Kuhanin ang default values base sa priority galing sa database
//             let ticketClass = ticket.priority ? ticket.priority.toLowerCase() : "low";
//             let badgeColor = badgeColors[ticket.priority] || "green";
//             let badgeText = ticket.priority || "Low";
            
//             let formattedDate = "No Date";
//             if (ticket.createdAt) {
//                 // KUNG STRING ANG FORMAT SA FIREBASE (Halimbawa: "2026-06-23 16:22:23" o "June 23, 2026, 4:22 PM")
//                 // Puputulin lang natin ito sa unang space o comma gamit ang split
//                 formattedDate = ticket.createdAt.split(' ')[0]; 
                
//                 // ALTERNATIBO: Kung gusto mo ng mas magandang format (Format: MM/DD/YYYY)
//                 const d = new Date(ticket.createdAt);
//                 formattedDate = d.toLocaleDateString(); 
//             }
//             // 🔥 DITO ANG LIMITASYON (Kapag sumobra sa 25 letters, puputulin at lalagyan ng '...')
//             const originalTitle = ticket.title || ""; 
//             const shortTitle = originalTitle.length > 25 
//                 ? originalTitle.substring(0, 25) + "..." 
//                 : originalTitle;
//             const originalName = ticket.createdByname || "User";
//             const shortName = originalName.length > 15 
//                 ? originalName.substring(0, 15) + "..." 
//                 : originalName;
//             // Logika para sa kulay ng ticket border/card base sa status
//             if (ticket.status === "ToDo") {
//                 ticketClass = "high";
//             } else if (ticket.status === "In Progress") {
//                 ticketClass = "medium"; 
//             } else if (ticket.status === "Done") {
//                 ticketClass = "low";
//             }

//             const ticketHTML = `
//         <div class="ticket ${ticketClass}" onclick="location.href='main-details.html?id=${ticket.ticketId}'">
//             <div class="ticket-meta-grid">
//                 <div class="meta-item">
//                     <span class="ticket-id">#${ticket.ticketId}</span>
//                 </div>
//                 <div class="meta-item text-right">
//                     <span class="meta-label">Created at:</span>
//                     <span class="meta-value date-text">${formattedDate}</span>
//                 </div>
//                 <div class="meta-item">
//                     <span class="meta-label">By:</span>
//                     <span class="meta-value">${shortName}</span>
//                 </div>
//                 <div class="meta-item">
//                     <span class="meta-label">To:</span>
//                     <span class="meta-value">${ticket.assignedToname || 'Unassigned'}</span>
//                 </div>
//             </div>

//             <div class="ticket-footer">
//                 <h3 class="ticket-title" title="${originalTitle}">${shortTitle}</h3>
//                 <span class="badge ${badgeColor}">${badgeText}</span>
//             </div>
//         </div>
//     `;

//             // I-sort sa tamang column at magdagdag sa kaukulang counter
//             if (ticket.status === "ToDo") {
//                 todoContainer.insertAdjacentHTML("beforeend", ticketHTML);
//                 todoCount++;
//             } else if (ticket.status === "In Progress") {
//                 progressContainer.insertAdjacentHTML("beforeend", ticketHTML);
//                 progressCount++;
//             } else if (ticket.status === "Done") {
//                 doneContainer.insertAdjacentHTML("beforeend", ticketHTML);
//                 doneCount++;
//             }
//         });
//     }

//     // Tiyaking may "No tasks..." placeholder kapag walang pumasok na ticket sa column
//     if (todoCount === 0) {
//         todoContainer.innerHTML = "<p class='no-tickets'>No tasks inside To Do</p>";
//     }
//     if (progressCount === 0) {
//         progressContainer.innerHTML = "<p class='no-tickets'>No tasks in progress</p>";
//     }
//     if (doneCount === 0) {
//         doneContainer.innerHTML = "<p class='no-tickets'>No completed tasks</p>";
//     }

//     // I-update ang mga text elements ng stats sa dashboard
//     if (statTotal) statTotal.textContent = totalCount;
//     if (statTodo) statTodo.textContent = todoCount;
//     if (statProgress) statProgress.textContent = progressCount;
//     if (statDone) statDone.textContent = doneCount;

//     // Itago ang loading overlay kapag tapos nang maproseso ang data
//     if (loadingOverlay) {
//         loadingOverlay.style.display = "none";
//     }
// });

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

// Variable para sa handle ng Realtime Database listener (para maiwasan ang memory leaks)
let ticketsListenerCancel = null;

// 🔥 HAKBANG 1: Pakinggan muna ang Auth State para masiguradong may makukuhang valid UID
onAuthStateChanged(auth, (user) => {
    // Kung nagbago ang auth state, tanggalin muna ang lumang database listener kung mayroon man
    if (ticketsListenerCancel) {
        ticketsListenerCancel();
    }

    if (user) {
        const currentUserId = user.uid; // Dito natin nakuha nang sigurado ang totoong UID
        console.log("Logged in User UID:", currentUserId); // I-debug sa console para makita mo

        // Pakinggan ang "tickets" node sa Realtime Database
        const ticketsRef = ref(db, "tickets");

        ticketsListenerCancel = onValue(ticketsRef, (snapshot) => {
            // Linisin muna ang mga container para hindi magdoble-doble ang HTML
            todoContainer.innerHTML = "";
            progressContainer.innerHTML = "";
            doneContainer.innerHTML = "";

            let totalCount = 0;
            let todoCount = 0;
            let progressCount = 0;
            let doneCount = 0;

            if (snapshot.exists()) {
                const data = snapshot.val();
                let rawTicketList = Object.values(data);

                // 🔥 HAKBANG 2: I-filter ang tickets gamit ang siguradong UID
                let ticketList = rawTicketList.filter((ticket) => {
                    // Mas ligtas na i-convert sa String at siguraduhing hindi undefined ang mga fields
                    const assignedTo = ticket.assignedTouid ? String(ticket.assignedTouid) : "";
                    const createdBy = ticket.createdByuid ? String(ticket.createdByuid) : "";
                    
                    return assignedTo === currentUserId || createdBy === currentUserId;
                });

                console.log("Filtered Tickets Count:", ticketList.length); // I-debug kung may pumasok na data

                // May antas o bigat ang bawat priority para sa pag-sort
                const priorityWeight = {
                    "Critical": 4,
                    "High": 3,
                    "Medium": 2,
                    "Low": 1
                };

                // ANG SORTING ALGORITHM
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
                            return String(a.ticketId).localeCompare(String(b.ticketId));
                        }
                    }
                });

                totalCount = ticketList.length;

                ticketList.forEach((ticket) => {
                    let ticketClass = ticket.priority ? ticket.priority.toLowerCase() : "low";
                    let badgeColor = badgeColors[ticket.priority] || "green";
                    let badgeText = ticket.priority || "Low";
                    
                    let formattedDate = "No Date";
                    if (ticket.createdAt) {
                        formattedDate = ticket.createdAt.split(' ')[0]; 
                        const d = new Date(ticket.createdAt);
                        formattedDate = d.toLocaleDateString(); 
                    }

                    const originalTitle = ticket.title || ""; 
                    const shortTitle = originalTitle.length > 25 ? originalTitle.substring(0, 25) + "..." : originalTitle;
                    const originalName = ticket.createdByname || "User";
                    const shortName = originalName.length > 15 ? originalName.substring(0, 15) + "..." : originalName;

                    if (ticket.status === "ToDo") {
                        ticketClass = "high";
                    } else if (ticket.status === "In Progress") {
                        ticketClass = "medium"; 
                    } else if (ticket.status === "Done") {
                        ticketClass = "low";
                    }

                    const ticketHTML = `
                        <div class="ticket ${ticketClass}" onclick="location.href='../main/main-details.html?id=${ticket.ticketId}'">
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

            // Placeholders kapag walang pumasok na ticket sa column
            if (todoCount === 0) todoContainer.innerHTML = "<p class='no-tickets'>No tasks inside To Do</p>";
            if (progressCount === 0) progressContainer.innerHTML = "<p class='no-tickets'>No tasks in progress</p>";
            if (doneCount === 0) doneContainer.innerHTML = "<p class='no-tickets'>No completed tasks</p>";

            // I-update ang stats dashboard
            if (statTotal) statTotal.textContent = totalCount;
            if (statTodo) statTodo.textContent = todoCount;
            if (statProgress) statProgress.textContent = progressCount;
            if (statDone) statDone.textContent = doneCount;

            if (loadingOverlay) loadingOverlay.style.display = "none";
        });

    } else {
        // 🔥 HAKBANG 3: Kung walang user na naka-login, i-redirect o itago ang loader
        console.log("Walang user na naka-log in.");
        if (loadingOverlay) loadingOverlay.style.display = "none";
        location.href = "../index.html"; // Opsyonal: I-uncomment kung gusto mo silang ibalik sa login screen
    }
});

const contentSets = document.getElementById("contentSets");

if (contentSets) {
  contentSets.addEventListener("click", function (e) {
    e.preventDefault(); // Pinipigilan ang '#' na mag-trigger sa URL
    window.location.href = "../contentSets/contentSet.html";
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
