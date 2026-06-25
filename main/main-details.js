import { auth, db } from "../firebase.js";
import { onAuthStateChanged,signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { ref, get, push, set , onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


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


 // Kunin ang mga HTML elements
const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get('id');

const detTicketId = document.getElementById("detTicketId");
const detTitle = document.getElementById("detTitle");
const detStatus = document.getElementById("detStatus");
const detPriority = document.getElementById("detPriority");
const detCategory = document.getElementById("detCategory");
const detCreatedAt = document.getElementById("detCreatedAt");
const detCreatedBy = document.getElementById("detCreatedBy");
const detAssignedTo = document.getElementById("detAssignedTo");
const detDescription = document.getElementById("detDescription");
const detResolvedAt = document.getElementById("detResolvedAt");
// Mga Buttons
const btnPickTicket = document.getElementById("btnPickTicket");
const btnResolveTicket = document.getElementById("btnResolveTicket");

// Variable para itabi ang kasalukuyang User Info galing sa auth state mo
let currentUserInfo = { uid: "", name: "" };

// Pakikinig sa kung sino ang naka-login para sa Pick Ticket functionality
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserInfo.uid = user.uid;
        // Kunin ang pangalan ng staff para sa assignment record
        const userRef = ref(db, "users/" + user.uid);
        const userSnap = await get(userRef);
        if (userSnap.exists()) {
            currentUserInfo.name = userSnap.val().fullName;
            currentUserInfo.workRole = userSnap.val().workRole;
        }
    } else {
        window.location.href = "../index.html";
    }
});

if (ticketId) {
    loadTicketDetails(ticketId);
} else {
    alert("No Ticket ID found!");
    window.location.href = "main.html";
}

let ticketCreatorUid = "";
const creatorActions = document.getElementById("creatorActions");
const btnDeleteTicket = document.getElementById("btnDeleteTicket");

async function loadTicketDetails(id) {
    try {
        const ticketRef = ref(db, "tickets/" + id);
        const snapshot = await get(ticketRef);

        if (snapshot.exists()) {
            const ticket = snapshot.val();

            // Display ticket data in HTML elements
            detTicketId.textContent = `#${ticket.ticketId}`;
            detTitle.textContent = ticket.title;
            detStatus.textContent = ticket.status;
            detPriority.textContent = ticket.priority;
            detCategory.textContent = ticket.category;
            
            // Format Date (Displays date portion only)
            detCreatedAt.textContent = ticket.createdAt;
            detDescription.textContent = ticket.description;

            // Handle displaying user object names safely
            const createdByName = ticket.createdByname || (ticket.createdBy ? ticket.createdBy.name : "Unknown");
            detCreatedBy.textContent = createdByName;
            
            const assignedName = ticket.assignedToname || "Unassigned";
            detAssignedTo.textContent = assignedName;
            // 🌟 PAG-CHECK KUNG RESOLVED NA: Kung walang resolved date, "Not yet" ang lalabas
            if (detResolvedAt) {
                detResolvedAt.textContent = ticket.resolvedAt ? ticket.resolvedAt : "Not yet";
            }
            detCreatedBy.setAttribute("data-uid", ticket.createdByname ? ticket.createdByname.uid : "");
            detAssignedTo.setAttribute("data-uid", ticket.assignedToname ? ticket.assignedToname.uid : "");
            
            // Map the creator UID variable globally
            ticketCreatorUid = ticket.createdByuid;

            // 🔥 DYNAMIC VISIBILITY CONFIGURATION FOR CREATOR ACTIONS
            // Shows the container if the current logged-in user is the ticket creator
            if (currentUserInfo && currentUserInfo.uid === ticketCreatorUid) {
                creatorActions.style.display = "flex"; // Uses flex to match your gap styling
            } else {
                creatorActions.style.display = "none";
            }

            // 🔥 BUTTON STATE CONTROLS BASED ON TICKET STATUS
            if (ticket.status === "Done") {
                btnPickTicket.disabled = true;
                btnResolveTicket.disabled = true;
                btnDeleteTicket.disabled = true; // Lock delete if resolved
                btnResolveTicket.innerHTML = "✅ Resolved";
            } else if (ticket.status === "In Progress") {
                btnPickTicket.disabled = true;
                btnPickTicket.innerHTML = "🏃 In Progress";
            } else {
                // Reset to defaults if status changes back to Open
                btnPickTicket.disabled = false;
                btnPickTicket.innerHTML = "🎯 Pick Ticket";
                btnResolveTicket.disabled = false;
                btnResolveTicket.innerHTML = "✅ Resolve Ticket";
            }

        } else {
            alert("Ticket does not exist.");
            window.location.href = "main.html";
        }
    } catch (error) {
        console.error("Error loading ticket details:", error);
    }
}

// --- EVENT FOR "PICK TICKET" ---
// btnPickTicket.addEventListener("click", async () => {
//     if (!ticketId || !currentUserInfo.uid) return;
//     // Security Guard Check
//     if (currentUserInfo.workRole !== "software-engineer" && currentUserInfo.workRole !== "data-analyst") {
//         alert("🔒 Access Denied: Only Software Engineers or Data Analysts can perform this action.");
//         return;
//     }
//     const confirmation = confirm("Are you sure you want to pick up and handle this ticket?");
//     if (!confirmation) return;

//     const ticketRef = ref(db, "tickets/" + ticketId);
//     const updateData = {
//         status: "In Progress",
//         assignedTouid: currentUserInfo.uid,
//         assignedToname: currentUserInfo.name
//     };

//     try {
//         await update(ticketRef, updateData);
//         alert("You have successfully picked up this ticket!");
//         loadTicketDetails(ticketId); 
//     } catch (error) {
//         console.error("Error picking ticket:", error);
//         alert("Failed to pick ticket.");
//     }
// });
btnPickTicket.addEventListener("click", async () => {
    console.log("=== DEBUG USER INFO ===");
    console.log("UID:", currentUserInfo.uid);
    console.log("Name:", currentUserInfo.name);
    console.log("Work Role:", currentUserInfo.workRole);
    console.log("Full User Object:", currentUserInfo);

    if (!ticketId || !currentUserInfo.uid) return;

    // Security Guard Check
    if (
        currentUserInfo.workRole !== "software-engineer" &&
        currentUserInfo.workRole !== "data-analyst"
    ) {
        alert(
            `🔒 Access Denied\nCurrent Role: ${currentUserInfo.workRole}. Only Engineer or Analyst can pick this ticket`
        );
        return;
    }

    const confirmation = confirm(
        "Are you sure you want to pick up and handle this ticket?"
    );

    if (!confirmation) return;

    const ticketRef = ref(db, "tickets/" + ticketId);

    const updateData = {
        status: "In Progress",
        assignedTouid: currentUserInfo.uid,
        assignedToname: currentUserInfo.name
    };

    try {
        await update(ticketRef, updateData);

        alert("You have successfully picked up this ticket!");

        loadTicketDetails(ticketId);

    } catch (error) {
        console.error("Error picking ticket:", error);
        alert("Failed to pick ticket.");
    }
});
// --- EVENT FOR "RESOLVE TICKET" ---
btnResolveTicket.addEventListener("click", async () => {
    if (!ticketId) return;

    // Security Guard Check
    if (currentUserInfo.uid !== ticketCreatorUid) {
        alert("🔒 Access Denied: Only the creator of this ticket can mark it as Resolved.");
        return; 
    }

    const confirmation = confirm("Are you sure you want to mark this ticket as Resolved?");
    if (!confirmation) return;

    const resolutionDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
    const ticketRef = ref(db, "tickets/" + ticketId);
    const updateData = { 
        status: "Done",
        resolvedAt: resolutionDate 
    };

    try {
        await update(ticketRef, updateData);
        alert("Ticket has been successfully resolved!");
        loadTicketDetails(ticketId); 
    } catch (error) {
        console.error("Error resolving ticket:", error);
        alert("Failed to resolve ticket.");
    }
});

// 🔥 NEW: EVENT FOR "DELETE TICKET"
if (btnDeleteTicket) {
    btnDeleteTicket.addEventListener("click", async () => {
        if (!ticketId) return;

        // Security Guard Check
        if (currentUserInfo.uid !== ticketCreatorUid) {
            alert("🔒 Access Denied: Only the creator of this ticket can delete it.");
            return;
        }

        const confirmation = confirm("CRITICAL: Are you sure you want to permanently delete this ticket? This action cannot be undone.");
        if (!confirmation) return;

        const ticketRef = ref(db, "tickets/" + ticketId);

        try {
            // Using Firebase 'remove' to cleanly delete the document
            await remove(ticketRef);
            alert("Ticket has been permanently deleted.");
            window.location.href = "main.html"; // Redirect back to index/main board dashboard view
        } catch (error) {
            console.error("Error deleting ticket:", error);
            alert("Failed to delete ticket.");
        }
    });
}
const allTicketsLink = document.getElementById("allTicketsLink");

if (allTicketsLink) {
  allTicketsLink.addEventListener("click", function (e) {
    e.preventDefault(); // Pinipigilan ang '#' na mag-trigger sa URL
    window.location.href = "../main/main.html";
  });
}

const assignedToMeLink = document.getElementById("assignedToMeLink");

if (assignedToMeLink) {
  assignedToMeLink.addEventListener("click", function (e) {
    e.preventDefault(); // Pinipigilan ang '#' na mag-trigger sa URL
    window.location.href = "../main-assign/main-assign.html";
  });
}