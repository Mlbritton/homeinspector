let inspectionItems = [];

function addInspectionItem() {
    const area = document.getElementById('area-select').value;
    const condition = document.getElementById('condition').value;
    const notes = document.getElementById('notes').value;
    const photoUpload = document.getElementById('photo-upload');
    const photos = photoUpload.files;

    if (!area || !condition) {
        alert('Please select an area and condition.');
        return;
    }

    const item = { area, condition, notes, photos: [] };

    // Convert photos to data URLs
    const photoPromises = Array.from(photos).map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    });

    Promise.all(photoPromises).then(photoDataUrls => {
        item.photos = photoDataUrls;
        inspectionItems.push(item);
        updateIssuesList();
        updateSummary();
        
        // Clear inputs
        document.getElementById('area-select').value = '';
        document.getElementById('condition').value = 'excellent';
        document.getElementById('notes').value = '';
        document.getElementById('photo-upload').value = '';
        document.getElementById('photo-preview').innerHTML = '';
    });
}

function updateIssuesList() {
    const issuesList = document.getElementById('issues-list');
    issuesList.innerHTML = '';

    inspectionItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'issue-item';
        itemElement.innerHTML = `
            <h4>${item.area} - ${item.condition}</h4>
            <p>${item.notes}</p>
            <div class="photo-container">
                ${item.photos.map(photo => `<img src="${photo}" class="photo-preview" alt="Inspection photo">`).join('')}
            </div>
            <button onclick="removeInspectionItem(${index})">Remove</button>
        `;
        issuesList.appendChild(itemElement);
    });
}

function updateSummary() {
    const conditions = {};
    inspectionItems.forEach(item => {
        conditions[item.condition] = (conditions[item.condition] || 0) + 1;
    });

    let summaryHTML = '<p>Total items inspected: ' + inspectionItems.length + '</p>';
    summaryHTML += '<p>Conditions breakdown:</p>';
    for (const [condition, count] of Object.entries(conditions)) {
        summaryHTML += `<p>${condition}: ${count}</p>`;
    }

    $('#summary-content').html(summaryHTML);
}

function removeItem(index) {
    inspectionItems.splice(index, 1);
    updateIssuesList();
    updateSummary();
}

function clearForm() {
    $('#area-select').val('');
    $('#condition').val('good');
    $('#notes').val('');
    $('#photo-upload').val('');
    $('#photo-preview').empty();
}

// Photo preview functionality
function handlePhotoUpload(event) {
    const files = event.target.files;
    const photoPreview = document.getElementById('photo-preview');
    photoPreview.innerHTML = ''; // Clear existing previews

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'photo-preview';
            photoPreview.appendChild(img);
        }

        reader.readAsDataURL(file);
    }
}

function generateReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yOffset = 20;

    // Add basic information
    doc.setFontSize(20);
    doc.text('Home Inspection Report', 105, yOffset, { align: 'center' });
    yOffset += 20;

    doc.setFontSize(12);
    doc.text(`Inspection Date: ${document.getElementById('inspection-date').value}`, 20, yOffset);
    yOffset += 10;
    doc.text(`Property Address: ${document.getElementById('property-address').value}`, 20, yOffset);
    yOffset += 10;
    doc.text(`Inspector Name: ${document.getElementById('inspector-name').value}`, 20, yOffset);
    yOffset += 20;

    // Add inspection items
    inspectionItems.forEach((item, index) => {
        if (yOffset > 250) {
            doc.addPage();
            yOffset = 20;
        }

        doc.setFontSize(14);
        doc.text(`${index + 1}. ${item.area} - ${item.condition}`, 20, yOffset);
        yOffset += 10;

        doc.setFontSize(12);
        const splitNotes = doc.splitTextToSize(item.notes, 170);
        doc.text(splitNotes, 20, yOffset);
        yOffset += splitNotes.length * 5 + 10;

        // Add photos
        if (item.photos.length > 0) {
            const photoWidth = 80;
            const photoHeight = 60;
            let xOffset = 20;

            item.photos.forEach((photo, photoIndex) => {
                if (xOffset + photoWidth > 190) {
                    xOffset = 20;
                    yOffset += photoHeight + 10;
                }

                if (yOffset + photoHeight > 280) {
                    doc.addPage();
                    yOffset = 20;
                }

                doc.addImage(photo, 'JPEG', xOffset, yOffset, photoWidth, photoHeight);
                xOffset += photoWidth + 10;
            });

            yOffset += photoHeight + 20;
        }
    });

    // Add summary
    doc.addPage();
    yOffset = 20;
    doc.setFontSize(16);
    doc.text('Summary', 105, yOffset, { align: 'center' });
    yOffset += 20;

    doc.setFontSize(12);
    const summaryContent = document.getElementById('summary-content').innerText;
    const splitSummary = doc.splitTextToSize(summaryContent, 170);
    doc.text(splitSummary, 20, yOffset);

    doc.save('home_inspection_report.pdf');
}

// Add event listener for photo upload
document.getElementById('photo-upload').addEventListener('change', handlePhotoUpload);
