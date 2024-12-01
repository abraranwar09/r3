document.addEventListener('DOMContentLoaded', () => {
    // Generate a session_id using the current timestamp
    const sessionId = `session_${Date.now()}`;
    // Save the session_id to local storage
    localStorage.setItem('session_id', sessionId);

    const toggles = document.querySelectorAll('.toggle');
    const toolToggles = document.querySelectorAll('.tool-toggle');

    // Fetch and update suggestion cards
    fetch('/ai/suggest')
        .then(response => response.json())
        .then(data => {
            // Update card contents
            const updateCard = document.getElementById('updateCard');
            const researchCard = document.getElementById('researchCard');
            const learnCard = document.getElementById('learnCard');

            if (updateCard) {
                updateCard.querySelector('p').textContent = data.update_topic;
            }
            if (researchCard) {
                researchCard.querySelector('p').textContent = data.research_topic;
            }
            if (learnCard) {
                learnCard.querySelector('p').textContent = data.learn_topic;
            }
        })
        .catch(error => console.error('Error fetching suggestions:', error));

    function toggleTool(toggle) {
        toggle.classList.toggle('active');
        const tool = toggle.dataset.tool;
        const sidebarToggle = document.querySelector(`.tool-toggle[data-tool="${tool}"]`);
        if (sidebarToggle) {
            sidebarToggle.classList.toggle('active');
        }
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => toggleTool(toggle));
    });

    toolToggles.forEach(toolToggle => {
        toolToggle.addEventListener('click', () => {
            toolToggle.classList.toggle('active');
            const tool = toolToggle.dataset.tool;
            const chatToggle = document.querySelector(`.toggle[data-tool="${tool}"]`);
            if (chatToggle) {
                chatToggle.classList.toggle('active');
            }
        });
    });
});