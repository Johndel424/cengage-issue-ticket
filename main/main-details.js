import { auth, db } from "../firebase.js";
import { onAuthStateChanged,signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { ref, get, push, set , onValue, update, remove , child} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


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
const detAssignedToEngineer = document.getElementById("detAssignedToEngineer");
const detAssignedToAnalyst = document.getElementById("detAssignedToAnalyst");
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
            detAssignedToAnalyst.textContent = ticket.contentSetAnalyst;
            detAssignedToEngineer.textContent = ticket.contentSetEngineer;
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
            // detAssignedToAnalyst.setAttribute("data-uid", ticket.contentSetAnalyst ? ticket.contentSetAnalyst.uid : "");
            // detAssignedToEngineer.setAttribute("data-uid", ticket.contentSetEngineer ? ticket.contentSetEngineer.uid : "");
            // Map the creator UID variable globally
            ticketCreatorUid = ticket.createdByuid;

            // 🔥 DYNAMIC VISIBILITY CONFIGURATION FOR CREATOR ACTIONS
            // Shows the container if the current logged-in user is the ticket creator
            if (currentUserInfo && currentUserInfo.uid === ticketCreatorUid) {
                creatorActions.style.display = "flex"; // Uses flex to match your gap styling
            } else {
                creatorActions.style.display = "none";
            }

            // 1. Kunin ang HTML Elements
            const editorActionsContainer = document.getElementById("editorActionsContainer");
            const btnBackToEditor = document.getElementById("btnBackToEditor");
 
            const selectRoleTarget = document.getElementById("selectRoleTarget");
            const btnAssignTo = document.getElementById("btnAssignTo");

function configureAssignUI() {
    if (currentUserInfo && currentUserInfo.workRole) {
        const role = currentUserInfo.workRole;

        // KUNG UPDATE-EDITOR O TEAM-LEAD
        if (role === "update-editor" || role === "team-lead") {
            selectRoleTarget.innerHTML = ""; // Linisin ang lumang options

            // 1. Idagdag si Engineer sa Dropdown
            if (ticket && ticket.contentSetEngineer) {
                const optEng = document.createElement("option");
                optEng.value = ticket.contentSetEngineerId || ""; // 🌟 PINALITAN: Ginamit ang Id imbes na Uid
                optEng.textContent = ticket.contentSetEngineer;    
                selectRoleTarget.appendChild(optEng);
            }

            // 2. Idagdag si Analyst sa Dropdown
            if (ticket && ticket.contentSetAnalyst) {
                const optAna = document.createElement("option");
                optAna.value = ticket.contentSetAnalystId || "";  // 🌟 PINALITAN: Ginamit ang Id imbes na Uid
                optAna.textContent = ticket.contentSetAnalyst;     
                selectRoleTarget.appendChild(optAna);
            }

            if (selectRoleTarget) selectRoleTarget.style.display = "inline-block";
            btnAssignTo.innerHTML = "📩 Send";

        } else if (role === "software-engineer") {
            if (selectRoleTarget) selectRoleTarget.style.display = "none";
            const analystName = ticket && ticket.contentSetAnalyst ? ticket.contentSetAnalyst : "Data Analyst";
            btnAssignTo.innerHTML = `👤 Assign to ${analystName}`;
            
        } else if (role === "data-analyst") {
            if (selectRoleTarget) selectRoleTarget.style.display = "none";
            const engineerName = ticket && ticket.contentSetEngineer ? ticket.contentSetEngineer : "Software Engineer";
            btnAssignTo.innerHTML = `👤 Assign to ${engineerName}`;
        }
    } else {
        setTimeout(configureAssignUI, 300);
    }
}

configureAssignUI();

        // 3. 🔥 DYNAMIC VISIBILITY CONFIGURATION FOR ASSIGNED EDITOR ACTIONS
        const assignedTouid = ticket ? ticket.assignedTouid : "";

        // Lalabas lang ang container kung ang logged-in user ang naka-assign AT HINDI "Done" ang status ng ticket
        if (currentUserInfo && currentUserInfo.uid === assignedTouid && assignedTouid !== "" && ticket.status !== "Done") {
            editorActionsContainer.style.display = "block"; 
        } else {
            editorActionsContainer.style.display = "none";  
        }
        // 🌟 BAGONG DAGDAG: Itago ang btnBackToEditor kapag pareho ang Creator at Assigned User
        const createdByuid = ticket ? ticket.createdByuid : "";

        if (assignedTouid === createdByuid && assignedTouid !== "") {
            btnBackToEditor.style.display = "none"; // Naka-hide kapag sila ay pareho
        } 
           
        // 🌟 COVERSATION HISTORY RENDERING (Email / Message Thread Style)
        const convoContainer = document.getElementById("convoHistoryContainer");

        if (convoContainer) {
            convoContainer.innerHTML = ""; // Linisin ang HTML container para hindi madoble kapag nag-reload

            if (ticket.conversation) {
                // Dahil Firebase object ang bumabalik (dahil sa push keys), gagawin nating array para mai-sort sa tamang oras
                const notesArray = Object.keys(ticket.conversation).map(key => ticket.conversation[key]);
                
                // 🔥 PINALITAN: I-sort mula sa Pinakabago (itaas/b) papunta sa Pinakaluma (baba/a)
                notesArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                notesArray.forEach(note => {
                    const noteDiv = document.createElement("div");
                    
                    // EMAIL/CHAT CARD STYLING (Baguhin mo na lang ang kulay o design sa CSS mo)
                    noteDiv.style.borderLeft = "4px solid #007bff"; 
                    noteDiv.style.padding = "12px";
                    noteDiv.style.marginBottom = "12px";
                    noteDiv.style.backgroundColor = "#f9fbfd";
                    noteDiv.style.borderRadius = "0 8px 8px 0";
                    noteDiv.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";

                    // Format ng Petsa para mas madaling basahin ng tao
                    const formattedDate = new Date(note.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    });

                    noteDiv.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-size: 0.9rem; color: #495057;">
                                <strong>${note.senderName}</strong> 
                                <span style="font-size: 0.8rem; background: #e9ecef; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">
                                    ${note.senderRole}
                                </span>
                            </span>
                            <span style="font-size: 0.8rem; color: #6c757d;">${formattedDate}</span>
                        </div>
                        <div style="font-size: 0.95rem; color: #212529; white-space: pre-wrap; line-height: 1.4;">
                            ${note.message}
                        </div>
                    `;
                    
                    convoContainer.appendChild(noteDiv);
                });
            } else {
                // Kapag bago pa lang ang ticket at wala pang nagaganap na pasahan ng notes
                convoContainer.innerHTML = `
                    <div style="text-align: center; color: #adb5bd; font-style: italic; padding: 20px;">
                        No conversation history yet. Notes will appear here once the ticket is assigned or updated.
                    </div>
                `;
            }
        }
btnAssignTo.onclick = async function() {
            const notesInput = document.getElementById("editorNotes");
            const notesValue = notesInput.value.trim();

            if (!notesValue) {
                alert("Please add a note before sending.");
                return;
            }

            let finalAssignedUid = "";
            let finalAssignedName = "";
            const role = currentUserInfo.workRole;

            // 1. DYNAMIC EXTRACTION NG RECIPIENT BASE SA ROLE
            if (role === "update-editor" || role === "team-lead") {
                const selectedOption = selectRoleTarget.options[selectRoleTarget.selectedIndex];
                
                if (!selectedOption || !selectedOption.value) {
                    alert("Please select a valid recipient from the dropdown.");
                    return;
                }
                
                finalAssignedUid = selectedOption.value;        // Dito na papasok ang tamang Id value!
                finalAssignedName = selectedOption.textContent; // Pangalan
            } else if (role === "software-engineer") {
                // Automatic na ipapasa sa Analyst gamit ang tamang entity keys
                finalAssignedUid = ticket.contentSetAnalystId || "";
                finalAssignedName = ticket.contentSetAnalyst || "Data Analyst";
            } else if (role === "data-analyst") {
                // Automatic na ipapasa sa Engineer gamit ang tamang entity keys
                finalAssignedUid = ticket.contentSetEngineerId || "";
                finalAssignedName = ticket.contentSetEngineer || "Software Engineer";
            }

            try {
                // 2. STORE NOTE IN FIREBASE
                const conversationRef = ref(db, `tickets/${id}/conversation`);
                const newNoteKey = push(conversationRef).key;

                const newNoteData = {
                    senderUid: currentUserInfo.uid,
                    senderName: currentUserInfo.name || "Unknown",
                    senderRole: role || "Staff",
                    message: notesValue,
                    timestamp: new Date().toISOString()
                };

                // 3. TRANSACTION UPDATE
                const updates = {};
                updates["assignedTouid"] = finalAssignedUid;
                updates["assignedToname"] = finalAssignedName;
                updates["status"] = "In Progress";
                updates[`conversation/${newNoteKey}`] = newNoteData;

                await update(ref(db, "tickets/" + id), updates);

                alert(`Note successfully sent! Ticket is now assigned to ${finalAssignedName}.`);
                
                notesInput.value = ""; 
                loadTicketDetails(id); 

            } catch (error) {
                console.error("Error sending note and updating ticket:", error);
                alert("Something went wrong. Please try again.");
            }
        };
btnBackToEditor.onclick = async function() {
                const notesInput = document.getElementById("editorNotes");
                const notesValue = notesInput.value.trim();

                if (!notesValue) {
                    alert("Please add a note before assigning the ticket back.");
                    return;
                }

                try {
                    const ticketRef = ref(db, "tickets/" + id);

                    // 1. Gumawa ng bagong unique key para sa note na ito para hindi ma-overwrite ang luma
                    const newNoteKey = push(child(ticketRef, "conversation")).key;

                    // 2. Ihanda ang data ng bagong note/message
                    const newNoteData = {
                        senderUid: currentUserInfo.uid,
                        senderName: currentUserInfo.name || "Unknown",
                        senderRole: currentUserInfo.workRole || "Staff",
                        message: notesValue,
                        timestamp: new Date().toISOString() // Naka-standard ISO format para madaling i-sort mamaya
                    };

                    // 3. Pagsamahin ang pag-update ng Assignment at pag-save ng Note
                    const updates = {};
                    
                    // Ibalik sa Creator ang assignment gamit ang mga variables mo sa taas
                    updates["assignedToname"] = ticket.createdByname || "Unknown";
                    updates["assignedTouid"] = ticket.createdByuid || "";
                    updates["status"] = "In Progress"; // I-ensure na active ang status kung ibinalik

                    // Dito ise-store ang note sa loob ng 'conversation' sub-folder nang hindi nabubura ang mga dati
                    updates["conversation/" + newNoteKey] = newNoteData;

                    // Isang bagsakang update sa Firebase
                    await update(ticketRef, updates);

                    alert(`Ticket assigned back to ${ticket.createdByname || "Creator"} and note added!`);
                    
                    // Linisin ang input field at i-reload ang detalye
                    notesInput.value = "";
                    loadTicketDetails(id); 

                } catch (error) {
                    console.error("Error saving conversation and assigning ticket:", error);
                    alert("Something went wrong. Please try again.");
                }
            };
            // Kunin ang mga pangalan (gamit ang fallback values na ginawa mo sa itaas)
            const creatorName = ticket.createdByname || (ticket.createdBy ? ticket.createdBy.name : "Unknown");
           

            // Titingnan kung HINDI magkapareho ang pangalan
            const isNotSameUser = creatorName !== assignedName;

            if (ticket.status === "Done") {
                btnPickTicket.disabled = true;
                btnResolveTicket.disabled = true;
                btnDeleteTicket.disabled = true;
                btnResolveTicket.innerHTML = "✅ Resolved";
            } else if (ticket.status === "In Progress") {
                btnPickTicket.disabled = true;
                btnPickTicket.innerHTML = "🏃 In Progress";
                btnResolveTicket.disabled = isNotSameUser; // Disabled kapag magkaiba ang pangalan
            } else {
                btnPickTicket.disabled = isNotSameUser;
                btnPickTicket.innerHTML = "🎯 Pick Ticket";
                btnResolveTicket.disabled = isNotSameUser;
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
    e.preventDefault();
    window.location.href = "../main/main.html";
  });
}

const assignedToMeLink = document.getElementById("assignedToMeLink");

if (assignedToMeLink) {
  assignedToMeLink.addEventListener("click", function (e) {
    e.preventDefault();
    window.location.href = "../main-assign/main-assign.html";
  });
}

