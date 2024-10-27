let inspectionItems = [];

function addInspectionItem() {
    const area = $('#area-select').val();
    const condition = $('#condition').val();
    const notes = $('#notes').val();
    const photos = $('#photo-upload')[0].files;

    if (!area || !condition) {
        alert('Please select an area and condition');
        return;
    }

    const item = {
        area,
        condition,
        notes,
        photos: Array.from(photos),
        timestamp: new Date().toISOString()
    };

    inspectionItems.push(item);
    updateIssuesList();
    updateSummary();
    clearForm();
}

function updateIssuesList() {
    const $issuesList = $('#issues-list');
    $issuesList.empty();

    inspectionItems.forEach((item, index) => {
        $(`<div class="issue-item">
            <strong>${item.area}</strong> - Condition: ${item.condition}
            <p>${item.notes}</p>
            <button onclick="removeItem(${index})">Remove</button>
        </div>`).appendTo($issuesList);
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
$('#photo-upload').on('change', function(e) {
    const $preview = $('#photo-preview');
    $preview.empty();

    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            $('<img>', {
                src: e.target.result,
                class: 'photo-preview'
            }).appendTo($preview);
        }
        reader.readAsDataURL(file);
    });
});

function generateReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Home Inspection Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${$('#inspection-date').val()}`, 20, 40);
    doc.text(`Address: ${$('#property-address').val()}`, 20, 50);
    doc.text(`Inspector: ${$('#inspector-name').val()}`, 20, 60);

    // Add inspection items
    let yPosition = 80;
    
    // Process each inspection item and its photos
    inspectionItems.forEach(item => {
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(`Area: ${item.area}`, 20, yPosition);
        doc.setFontSize(12);
        doc.text(`Condition: ${item.condition}`, 20, yPosition + 10);
        doc.text(`Notes: ${item.notes}`, 20, yPosition + 20);
        
        // Add photos if they exist
        if (item.photos && item.photos.length > 0) {
            yPosition += 30;
            
            item.photos.forEach((photo, index) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Check if we need a new page for the image
                    if (yPosition > 220) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    // Add the image to the PDF
                    try {
                        doc.addImage(
                            e.target.result,
                            'JPEG',
                            20,
                            yPosition,
                            80,  // width in mm
                            60   // height in mm
                        );
                        yPosition += 70;
                    } catch (err) {
                        console.error('Error adding image:', err);
                    }
                    
                    // Save the PDF after the last image of the last item is processed
                    if (index === item.photos.length - 1) {
                        doc.save('home-inspection-report.pdf');
                    }
                };
                reader.readAsDataURL(photo);
            });
        }
        
        yPosition += 40;
    });

    // Only save if there are no photos (otherwise it's handled in the photo processing)
    if (!inspectionItems.some(item => item.photos && item.photos.length > 0)) {
        doc.save('home-inspection-report.pdf');
    }
}
