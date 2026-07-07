document.addEventListener("DOMContentLoaded", () => {
    const galleryGrid = document.getElementById('gallery-grid');
    const modal = document.getElementById('design-modal');
    const closeBtn = document.querySelector('.close-btn');
    const modalMainImg = document.getElementById('modal-main-img');
    const modalTitle = document.getElementById('modal-title');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const counterEl = document.getElementById('image-counter');

    let whatsappNumber = '';
    let currentDesign = null;
    let currentIndex = 0;

    // 1. Fetch WhatsApp Number and clean it
    fetch('/api/config').then(res => res.json()).then(data => {
        // Remove any non-numeric characters (like +, spaces, or dashes)
        whatsappNumber = data.whatsappNumber.replace(/\D/g, '');
    });

    // 2. Load Designs from the Backend
    const loadDesigns = async () => {
        try {
            const res = await fetch('/api/designs');
            const designs = await res.json();
            
            if(designs.length === 0) {
                galleryGrid.innerHTML = "<p>No designs uploaded yet.</p>";
                return;
            }

            // Build the grid using the FIRST photo of each design
            galleryGrid.innerHTML = designs.map(design => `
                <div class="gallery-item" data-id="${design.id}">
                    <img src="${design.photos[0]}" alt="${design.name}">
                    <h3>${design.name}</h3>
                </div>
            `).join('');

            // Attach click event to each item to open the modal
            document.querySelectorAll('.gallery-item').forEach(item => {
                item.addEventListener('click', () => {
                    const selected = designs.find(d => d.id === item.dataset.id);
                    openModal(selected);
                });
            });

        } catch (error) {
            console.error("Error loading designs:", error);
            galleryGrid.innerHTML = "<p>Error loading designs. Please try again later.</p>";
        }
    };

    // 3. Open Modal Function
    const openModal = (design) => {
        currentDesign = design;
        currentIndex = 0; // Always start at the first image
        updateModalContent();
        modal.style.display = "block";
        document.body.style.overflow = 'hidden'; // Prevents background from scrolling
    };

    // 4. Update Modal Content (THE FIX IS HERE)
    const updateModalContent = () => {
        const photos = currentDesign.photos;
        
        // FIX: Instead of [0], we use [currentIndex] so the image actually changes!
        modalMainImg.src = photos[currentIndex];
        
        modalTitle.innerText = currentDesign.name;
        
        // Update Image Counter (e.g., "2 / 4")
        counterEl.innerText = `${currentIndex + 1} / ${photos.length}`;

        // Setup the dynamic WhatsApp Link
        // This gets the website address (localhost or your real domain)
        const siteUrl = window.location.origin;
        // This gets the specific URL for the current image being viewed
        const imageUrl = siteUrl + currentDesign.photos[currentIndex];
        
        const message = `Greetings Masott Klassiks, I would love to have this outfit: ${currentDesign.name}. View here: ${imageUrl}`;
        
        whatsappBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    };

    // 5. Navigation Controls (Next / Previous)
    nextBtn.onclick = (e) => {
        e.stopPropagation(); // Prevents accidental closing of modal
        currentIndex++;
        if (currentIndex >= currentDesign.photos.length) {
            currentIndex = 0; // Loop back to the beginning
        }
        updateModalContent();
    };

    prevBtn.onclick = (e) => {
        e.stopPropagation(); // Prevents accidental closing of modal
        currentIndex--;
        if (currentIndex < 0) {
            currentIndex = currentDesign.photos.length - 1; // Loop to the very last image
        }
        updateModalContent();
    };

    // 6. Close Modal Logic
    closeBtn.onclick = () => {
        modal.style.display = "none";
        document.body.style.overflow = 'auto'; // Restore scrolling
    };

    // Close if user clicks on the dark background area
    window.onclick = (e) => {
        if (e.target == modal) {
            modal.style.display = "none";
            document.body.style.overflow = 'auto';
        }
    };

    // Initial load
    loadDesigns();
});