document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: escape HTML to avoid injection
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Helper: generate initials from an email or name-like string
  function initialsFromIdentifier(id) {
    const local = (id || "").split("@")[0];
    const parts = local.split(/[\.\-_ ]/).filter(Boolean);
    if (parts.length === 0) return (local[0] || "?").toUpperCase();
    if (parts.length === 1) return (parts[0].slice(0, 2) || parts[0]).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Function to derive display name/email from participant entry
  function participantDisplay(p) {
    if (!p) return { display: "Unknown", id: "?" };
    if (typeof p === "string") return { display: p, id: p };
    // handle object like { name, email }
    if (typeof p === "object") {
      const display = p.name || p.email || JSON.stringify(p);
      const id = p.email || p.name || display;
      return { display, id };
    }
    return { display: String(p), id: String(p) };
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset select options (keep the placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participantsArr = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = (details.max_participants || 0) - participantsArr.length;

        // Build participants section
        let participantsHTML = "";
        if (participantsArr.length > 0) {
          participantsHTML = `<div class="participants"><h5>Participants</h5><ul style="list-style-type: none; padding: 0;">`;
          participantsHTML += participantsArr
            .map((p) => {
              const { display, id } = participantDisplay(p);
              const initials = initialsFromIdentifier(id);
              return `<li>
                        <span class="avatar">${escapeHtml(initials)}</span>
                        <span class="name">${escapeHtml(display)}</span>
                        <button class="delete-btn" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(id)}">&times;</button>
                      </li>`;
            })
            .join("");
          participantsHTML += `</ul></div>`;
        } else {
          participantsHTML = `<div class="participants empty">No participants yet</div>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description || "")}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule || "TBD")}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners for delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const activity = event.target.dataset.activity;
          const email = event.target.dataset.email;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
              {
                method: "DELETE",
              }
            );

            if (response.ok) {
              fetchActivities(); // Refresh activities to show updated participants
            } else {
              console.error("Failed to unregister participant");
            }
          } catch (error) {
            console.error("Error unregistering participant:", error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
