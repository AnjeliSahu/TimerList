
let allTimers = []; // Store all data for filtering
let filteredTimers = []; // Store filtered results

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    if (dateTimeString.includes('/')) return dateTimeString;
    
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleString();
    } catch (e) {
        return dateTimeString;
    }
}

function extractDate(dateTimeString) {
    if (!dateTimeString) return '';
    
    try {
        const date = new Date(dateTimeString);
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch (e) {
        return '';
    }
}

function highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function displayData(timers, searchTerms = {}) {
    const tbody = document.getElementById('reportBody');
    const loadingMessage = document.getElementById('loadingMessage');
    const reportTable = document.getElementById('reportTable');
    const resultsInfo = document.getElementById('resultsInfo');
    const noResults = document.getElementById('noResults');
    
    // Clear existing content
    tbody.innerHTML = '';
    
    // Update results info
    resultsInfo.textContent = `Showing ${timers.length} of ${allTimers.length} records`;
    resultsInfo.style.display = 'block';
    
    if (timers.length === 0) {
        reportTable.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    let currentUser = '';
    
    timers.forEach((rec, idx) => {
        const row = document.createElement('tr');
        row.className = 'zebra';
        
        if (rec.userName !== currentUser) {
            if (currentUser !== '') {
                row.classList.add('user-group');
            }
            currentUser = rec.userName;
        }
        
        // Apply highlighting to matching terms
        const userName = highlightText(rec.userName || '', searchTerms.user);
        const project = highlightText(rec.project || '', searchTerms.project);
        const activity = highlightText(rec.activity || '', searchTerms.activity);
        const task = highlightText(rec.task || '', searchTerms.task);
        
        row.innerHTML = `
            <td>${userName}</td>
            <td>${project}</td>
            <td>${activity}</td>
            <td>${task}</td>
            <td>${formatDateTime(rec.startTime)}</td>
            <td>${formatDateTime(rec.endTime)}</td>
            <td>${rec.duration || ''}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    loadingMessage.style.display = 'none';
    reportTable.style.display = 'table';
}

function applyFilters() {
    const searchTerms = {
        user: document.getElementById('searchUser').value.toLowerCase().trim(),
        project: document.getElementById('searchProject').value.toLowerCase().trim(),
        activity: document.getElementById('searchActivity').value.toLowerCase().trim(),
        task: document.getElementById('searchTask').value.toLowerCase().trim(),
        startDate: document.getElementById('searchStartDate').value,
        endDate: document.getElementById('searchEndDate').value
    };
    
    filteredTimers = allTimers.filter(timer => {
        // Text-based filters
        if (searchTerms.user && !timer.userName.toLowerCase().includes(searchTerms.user)) {
            return false;
        }
        if (searchTerms.project && !timer.project.toLowerCase().includes(searchTerms.project)) {
            return false;
        }
        if (searchTerms.activity && !timer.activity.toLowerCase().includes(searchTerms.activity)) {
            return false;
        }
        if (searchTerms.task && !timer.task.toLowerCase().includes(searchTerms.task)) {
            return false;
        }
        
        // Date-based filters
        if (searchTerms.startDate || searchTerms.endDate) {
            const recordStartDate = extractDate(timer.startTime);
            const recordEndDate = extractDate(timer.endTime);
            
            if (searchTerms.startDate && recordStartDate && recordStartDate < searchTerms.startDate) {
                return false;
            }
            if (searchTerms.endDate && recordEndDate && recordEndDate > searchTerms.endDate) {
                return false;
            }
        }
        
        return true;
    });
    
    displayData(filteredTimers, searchTerms);
}

function clearFilters() {
    // Clear all input fields
    document.getElementById('searchUser').value = '';
    document.getElementById('searchProject').value = '';
    document.getElementById('searchActivity').value = '';
    document.getElementById('searchTask').value = '';
    document.getElementById('searchStartDate').value = '';
    document.getElementById('searchEndDate').value = '';
    
    // Show all data
    filteredTimers = [...allTimers];
    displayData(filteredTimers);
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const loadingMessage = document.getElementById('loadingMessage');
    
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    loadingMessage.style.display = 'none';
}

// Add real-time search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInputs = ['searchUser', 'searchProject', 'searchActivity', 'searchTask'];
    
    searchInputs.forEach(inputId => {
        document.getElementById(inputId).addEventListener('input', function() {
            // Add a small delay to avoid too many filter calls
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                applyFilters();
            }, 300);
        });
    });
    
    // Date inputs trigger immediate filtering
    document.getElementById('searchStartDate').addEventListener('change', applyFilters);
    document.getElementById('searchEndDate').addEventListener('change', applyFilters);
    
    // Enter key also triggers search
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
});

// Fetch data from PHP backend
fetch('config.php')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Received data:', data);
        
        if (!data.success) {
            showError("Error fetching data: " + (data.error || 'Unknown error'));
            return;
        }
        
        if (!data.timers || !Array.isArray(data.timers)) {
            showError("Invalid data format received from server.");
            return;
        }
        
        allTimers = data.timers;
        filteredTimers = [...allTimers];
        displayData(filteredTimers);
    })
    .catch(error => {
        console.error('Fetch error:', error);
        showError("Could not load data. Please check your connection and try again.");
    });
