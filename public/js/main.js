// Fetch config to get WhatsApp number dynamically
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch('/api/config');
        const data = await res.json();
        const contactLinks = document.querySelectorAll('#contact-link');
        
        contactLinks.forEach(link => {
            link.href = `https://wa.me/${data.whatsappNumber}`;
            link.target = "_blank";
        });
    } catch (err) {
        console.error("Error fetching config:", err);
    }
});