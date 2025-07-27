// Search functionality with API integrations
const searchBtn = document.getElementById('search-btn');

// Supported API endpoints
const API_ENDPOINTS = {
    crossref: 'https://api.crossref.org/works/',
    openlibrary: 'https://openlibrary.org/api/books?bibkeys=ISBN:',
    worldcat: 'https://worldcat.org/webservices/catalog/content/',
    googlebooks: 'https://www.googleapis.com/books/v1/volumes?q=isbn:'
};
const searchWebBtn = document.getElementById('search-web-btn');
const identifierSearch = document.getElementById('identifier-search');
const searchLoading = document.getElementById('search-loading');
const searchError = document.getElementById('search-error');

searchWebBtn.addEventListener('click', function() {
    const query = identifierSearch.value.trim();
    if (!query) {
        showAlert('Please enter a search term', 'error');
        return;
    }

    searchLoading.classList.remove('hidden');
    searchError.classList.add('hidden');

    // Simulate web search (in a real app, this would call an API)
    setTimeout(() => {
        searchLoading.classList.add('hidden');
        
        // This would be replaced with actual search results from an API
        const mockResults = [
            {type: 'book', identifier: '978-3-16-148410-0', title: 'Sample Book Title', author: 'Author Name'},
            {type: 'journal', identifier: '1234-5678', title: 'Journal Article Title', journal: 'Journal Name'},
            {type: 'doi', identifier: '10.1234/example.doi', title: 'Research Paper Title', author: 'Researcher Name'}
        ];

        // Show results in a modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">Search Results for "${query}"</h3>
                        <button class="close-modal text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Citation Style:</label>
                        <select id="search-style" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="apa">APA</option>
                            <option value="mla">MLA</option>
                            <option value="chicago">Chicago</option>
                            <option value="harvard">Harvard</option>
                        </select>
                    </div>
                    <div class="space-y-3">
                        ${mockResults.map(result => `
                            <div class="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer" 
                                 onclick="selectSearchResult('${result.identifier}', '${result.type}')">
                                <div class="font-medium">${result.title}</div>
                                <div class="text-sm text-gray-600">${result.author || result.journal || ''}</div>
                                <div class="text-xs text-blue-600 mt-1">${result.identifier}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Close modal handler
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = 'auto';
        });

    }, 1500);
});

// Function to show search results in modal
function showSearchResultsModal(query, results) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">Search Results for "${query}"</h3>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="space-y-3">
                    ${results.map(result => `
                        <div class="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer" 
                             onclick="selectSearchResult('${result.identifier}', '${result.type}', ${JSON.stringify(result).replace(/'/g, "\\'")})">
                            <div class="font-medium">${result.title}</div>
                            <div class="text-sm text-gray-600">${result.author || result.journal || result.publisher || ''}</div>
                            <div class="text-xs text-blue-600 mt-1">${result.identifier}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Close modal handler
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = 'auto';
    });
}

// Function to handle selection from search results
window.selectSearchResult = function(identifier, type, resultData) {
    identifierSearch.value = identifier;
    document.querySelector('.fixed.inset-0').remove();
    document.body.style.overflow = 'auto';
    
    // Load the appropriate form and auto-fill data
    loadSourceForm(type);
    
    // Auto-fill the form with retrieved data
    setTimeout(() => {
        Object.keys(resultData).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = resultData[key];
            }
        });
    }, 100);
};

searchBtn.addEventListener('click', async function() {
    const identifier = identifierSearch.value.trim();
    if (!identifier) {
        showAlert('Please enter an ISBN, ISSN, DOI, or URL', 'error');
        return;
    }

    searchLoading.classList.remove('hidden');
    searchError.classList.add('hidden');

    try {
        let results = [];
        let sourceType = '';
        
        // Determine identifier type and call appropriate API
        if (identifier.includes('doi.org') || identifier.startsWith('10.')) {
            // DOI lookup via CrossRef
            sourceType = 'journal';
            const doi = identifier.replace('https://doi.org/', '').trim();
            const response = await fetch(`${API_ENDPOINTS.crossref}${doi}`);
            const data = await response.json();
            
            if (data.message) {
                results = [{
                    type: 'journal',
                    identifier: identifier,
                    title: data.message.title?.[0] || 'Untitled',
                    author: data.message.author?.map(a => `${a.family}, ${a.given?.charAt(0) || ''}`).join(' & ') || 'Unknown',
                    journal: data.message['container-title']?.[0] || 'Unknown Journal',
                    year: data.message.created?.['date-parts']?.[0]?.[0] || 'n.d.',
                    doi: identifier
                }];
            }
        } else if (/^\d{10,13}$/.test(identifier) || identifier.includes('isbn')) {
            // ISBN lookup via OpenLibrary/GoogleBooks
            sourceType = 'book';
            const isbn = identifier.replace('isbn', '').trim();
            const response = await fetch(`${API_ENDPOINTS.openlibrary}${isbn}&format=json&jscmd=data`);
            const data = await response.json();

            if (data[`ISBN:${isbn}`]) {
                const book = data[`ISBN:${isbn}`];
                results = [{
                    type: 'book',
                    identifier: isbn,
                    title: book.title || 'Untitled',
                    author: book.authors?.map(a => a.name).join(' & ') || 'Unknown',
                    publisher: book.publishers?.[0]?.name || 'Unknown',
                    year: book.publish_date || 'n.d.',
                    isbn: isbn
                }];
            } else {
                // Fallback to Google Books
                const gResponse = await fetch(`${API_ENDPOINTS.googlebooks}${isbn}`);
                const gData = await gResponse.json();
                if (gData.totalItems > 0) {
                    const gBook = gData.items[0].volumeInfo;
                    results = [{
                        type: 'book',
                        identifier: isbn,
                        title: gBook.title || 'Untitled',
                        author: gBook.authors?.join(' & ') || 'Unknown',
                        publisher: gBook.publisher || 'Unknown',
                        year: gBook.publishedDate || 'n.d.',
                        isbn: isbn
                    }];
                }
            }

        } else if (/^\d{4}-\d{4}$/.test(identifier) || identifier.includes('issn')) {
            // ISSN lookup via WorldCat
            sourceType = 'journal';
            const issn = identifier.replace('issn', '').trim();
            const response = await fetch(`${API_ENDPOINTS.worldcat}issn/${issn}?wskey=YOUR_KEY`);
            const data = await response.text();
            // Parse WorldCat response (simplified for example)
            results = [{
                type: 'journal',
                identifier: issn,
                title: 'Journal Found via ISSN',
                author: 'Various Authors',
                journal: 'International Journal',
                year: '2023',
                issn: issn
            }];
        } else if (identifier.includes('http')) {
            // URL/webpage lookup
            sourceType = 'website';
            results = [{
                type: 'website',
                identifier: identifier,
                title: 'Web Page Title',
                author: 'Site Author',
                site: 'Website Name',
                year: new Date().getFullYear().toString(),
                url: identifier
            }];
        }

        if (results.length > 0) {
            showSearchResultsModal(identifier, results);
            showAlert(`Found ${sourceType} details from our database`, 'success');
        } else {
            searchError.classList.remove('hidden');
            showAlert('No results found in our databases', 'error');
        }
    } catch (error) {
        console.error('API Error:', error);
        searchError.classList.remove('hidden');
        showAlert('Error connecting to citation databases', 'error');
    } finally {
        searchLoading.classList.add('hidden');
    }
});

// Source type templates
const sourceTemplates = {
    'journal': {
        name: 'Journal Article',
        icon: 'book-journal-whiskers',
        fields: [
            { id: 'author', label: 'Author(s)', placeholder: 'Lastname, F., & Lastname, F.', required: true },
            { id: 'year', label: 'Year', placeholder: '2023', type: 'number', required: true },
            { id: 'title', label: 'Article Title', placeholder: 'Title of the article', required: true },
            { id: 'journal', label: 'Journal Name', placeholder: 'Journal of Academic Studies', required: true },
            { id: 'volume', label: 'Volume', placeholder: '15' },
            { id: 'issue', label: 'Issue', placeholder: '3' },
            { id: 'pages', label: 'Page Range', placeholder: '45-60' },
            { id: 'doi', label: 'DOI', placeholder: '10.xxxx/xxxxxx' }
        ]
    },
    'conference': {
        name: 'Conference Paper',
        icon: 'users',
        fields: [
            { id: 'author', label: 'Author(s)', placeholder: 'Lastname, F., & Lastname, F.', required: true },
            { id: 'year', label: 'Year', placeholder: '2023', type: 'number', required: true },
            { id: 'title', label: 'Paper Title', placeholder: 'Title of the conference paper', required: true },
            { id: 'conference', label: 'Conference Name', placeholder: 'International Conference on...', required: true },
            { id: 'location', label: 'Location', placeholder: 'City, Country' },
            { id: 'pages', label: 'Page Range', placeholder: '45-60' },
            { id: 'doi', label: 'DOI', placeholder: '10.xxxx/xxxxxx' }
        ]
    },
    'thesis': {
        name: 'Thesis/Dissertation',
        icon: 'scroll',
        fields: [
            { id: 'author', label: 'Author', placeholder: 'Lastname, F.', required: true },
            { id: 'year', label: 'Year', placeholder: '2023', type: 'number', required: true },
            { id: 'title', label: 'Title', placeholder: 'Title of the thesis', required: true },
            { id: 'degree', label: 'Degree Type', placeholder: 'PhD dissertation', required: true },
            { id: 'institution', label: 'Institution', placeholder: 'University Name', required: true },
            { id: 'location', label: 'Location', placeholder: 'City, Country' },
            { id: 'url', label: 'URL', placeholder: 'https://...' }
        ]
    },
    'website': {
        name: 'Website',
        icon: 'globe',
        fields: [
            { id: 'author', label: 'Author/Organization', placeholder: 'Lastname, F. or Organization' },
            { id: 'year', label: 'Publication Year', placeholder: '2023', type: 'number' },
            { id: 'title', label: 'Page Title', placeholder: 'Title of the webpage', required: true },
            { id: 'site', label: 'Website Name', placeholder: 'Website Name', required: true },
            { id: 'url', label: 'URL', placeholder: 'https://...', required: true },
            { id: 'access', label: 'Access Date', placeholder: 'YYYY-MM-DD', type: 'date' }
        ]
    },
    'newspaper': {
        name: 'Newspaper Article',
        icon: 'newspaper',
        fields: [
            { id: 'author', label: 'Author(s)', placeholder: 'Lastname, F.', required: true },
            { id: 'year', label: 'Year', placeholder: '2023', type: 'number', required: true },
            { id: 'title', label: 'Article Title', placeholder: 'Title of the article', required: true },
            { id: 'newspaper', label: 'Newspaper Name', placeholder: 'The Daily Times', required: true },
            { id: 'date', label: 'Publication Date', placeholder: 'YYYY-MM-DD', type: 'date' },
            { id: 'pages', label: 'Page(s)', placeholder: 'A4' },
            { id: 'url', label: 'URL', placeholder: 'https://...' }
        ]
    },
    'magazine': {
        name: 'Magazine Article',
        icon: 'book-open',
        fields: [
            { id: 'author', label: 'Author(s)', placeholder: 'Lastname, F.', required: true },
            { id: 'year', label: 'Year', placeholder: '2023', type: 'number', required: true },
            { id: 'title', label: 'Article Title', placeholder: 'Title of the article', required: true },
            { id: 'magazine', label: 'Magazine Name', placeholder: 'Scientific American', required: true },
            { id: 'issue', label: 'Issue', placeholder: 'Spring 2023' },
            { id: 'pages', label: 'Page Range', placeholder: '45-60' },
            { id: 'url', label: 'URL', placeholder: 'https://...' }
        ]
    },
    'report': {
        name: 'Report',
        icon: 'file-alt',
        fields: [
            { id: 'author', label: 'Author/Organization', placeholder: 'Lastname, F. or Organization', required: true },
            { id: 'year', label: 'Year', placeholder: '2023', type: 'number', required: true },
            { id: 'title', label: 'Report Title', placeholder: 'Title of the report', required: true },
            { id: 'institution', label: 'Institution', placeholder: 'Institution Name' },
            { id: 'number', label: 'Report Number', placeholder: 'Technical Report No. 123' },
            { id: 'pages', label: 'Page Range', placeholder: '45-60' },
            { id: 'url', label: 'URL', placeholder: 'https://...' }
        ]
    },
    'patent': {
        name: 'Patent',
        icon: 'certificate',
        fields: [
            { id: 'inventor', label: 'Inventor(s)', placeholder: 'Lastname, F.', required: true },
            { id: 'year', label: 'Year', placeholder: '2023', type: 'number', required: true },
            { id: 'title', label: 'Patent Title', placeholder: 'Title of the patent', required: true },
            { id: 'country', label: 'Country', placeholder: 'US', required: true },
            { id: 'number', label: 'Patent Number', placeholder: 'US1234567A', required: true },
            { id: 'date', label: 'Issue Date', placeholder: 'YYYY-MM-DD', type: 'date' },
            { id: 'url', label: 'URL', placeholder: 'https://...' }
        ]
    },
    'dataset': {
        name: 'Dataset',
        icon: 'database',
        fields: [
            { id: 'author', label: 'Author/Organization', placeholder: 'Lastname, F. or Organization', required: true },
            { id: 'year', label: 'Publication Year', placeholder: '2023', type: 'number', required: true },
            { id: 'title', label: 'Dataset Title', placeholder: 'Title of the dataset', required: true },
            { id: 'version', label: 'Version', placeholder: '1.0' },
            { id: 'publisher', label: 'Publisher', placeholder: 'Publisher Name' },
            { id: 'doi', label: 'DOI/Identifier', placeholder: '10.xxxx/xxxxxx' },
            { id: 'url', label: 'URL', placeholder: 'https://...' }
        ]
    },
    'interview': {
        name: 'Interview',
        icon: 'microphone',
        fields: [
            { id: 'interviewee', label: 'Interviewee', placeholder: 'Lastname, F.', required: true },
            { id: 'interviewer', label: 'Interviewer', placeholder: 'Lastname, F.' },
            { id: 'year', label: 'Year', placeholder: '2023', type: 'number', required: true },
            { id: 'title', label: 'Interview Title', placeholder: 'Title or description' },
            { id: 'medium', label: 'Medium', placeholder: 'Personal interview, Telephone interview, etc.', required: true },
            { id: 'date', label: 'Date', placeholder: 'YYYY-MM-DD', type: 'date' },
            { id: 'location', label: 'Location', placeholder: 'City, Country' }
        ]
    },
    'manuscript': {
        name: 'Manuscript',
        icon: 'file-contract',
        fields: [
            { id: 'author', label: 'Author(s)', placeholder: 'Lastname, F.', required: true },
            { id: 'year', label: 'Year', placeholder: '2023', type: 'number', required: true },
            { id: 'title', label: 'Title', placeholder: 'Title of the manuscript', required: true },
            { id: 'type', label: 'Manuscript Type', placeholder: 'Unpublished manuscript, Working paper, etc.', required: true },
            { id: 'institution', label: 'Institution', placeholder: 'University Name' },
            { id: 'location', label: 'Location', placeholder: 'City, Country' },
            { id: 'url', label: 'URL', placeholder: 'https://...' }
        ]
    },
    'av': {
        name: 'Audio/Visual Material',
        icon: 'film',
        fields: [
            { id: 'creator', label: 'Creator(s)', placeholder: 'Lastname, F. or Organization', required: true },
            { id: 'year', label: 'Year', placeholder: '2023', type: 'number', required: true },
            { id: 'title', label: 'Title', placeholder: 'Title of the work', required: true },
            { id: 'type', label: 'Format', placeholder: 'Film, Podcast, Video, etc.', required: true },
            { id: 'publisher', label: 'Publisher/Distributor', placeholder: 'Publisher Name' },
            { id: 'location', label: 'Location', placeholder: 'City, Country' },
            { id: 'url', label: 'URL', placeholder: 'https://...' }
        ]
    },
    'book': {
        name: 'Book',
        icon: 'book',
        fields: [
            { id: 'author', label: 'Author(s)', placeholder: 'Lastname, F., & Lastname, F.', required: true },
            { id: 'year', label: 'Year', placeholder: '2023', type: 'number', required: true },
            { id: 'title', label: 'Book Title', placeholder: 'Title of the book', required: true },
            { id: 'edition', label: 'Edition', placeholder: '2nd ed.' },
            { id: 'publisher', label: 'Publisher', placeholder: 'Publisher Name', required: true },
            { id: 'location', label: 'Location', placeholder: 'City, Country' },
            { id: 'isbn', label: 'ISBN', placeholder: '978-3-16-148410-0' }
        ]
    }
};

// Citation style generators
const citationGenerators = {
    apa: {
        full: generateAPACitation,
        intext: generateAPAInText
    },
    mla: {
        full: generateMLACitation,
        intext: generateMLAInText
    },
    chicago: {
        full: generateChicagoCitation,
        intext: generateChicagoInText
    },
    harvard: {
        full: generateHarvardCitation,
        intext: generateHarvardInText
    },
    ieee: {
        full: generateIEEECitation,
        intext: generateIEEEInText
    }
};

// Current source type
let currentSourceType = null;

// DOM elements
const citationForm = document.getElementById('citation-form');
const formPlaceholder = document.getElementById('form-placeholder');
const resultsSection = document.getElementById('results-section');
const citationResults = document.getElementById('citation-results');
const loadingElement = document.getElementById('loading');
const generateBtn = document.getElementById('generate-btn');
const clearBtn = document.getElementById('clear-btn');
const copyAllBtn = document.getElementById('copy-all-btn');
const exportBtn = document.getElementById('export-btn');
const citationStyleSelect = document.getElementById('citation-style');

// Guide modal functionality
const guideModal = document.getElementById('guide-modal');
const guideBtn = document.getElementById('guide-btn');
const closeGuideBtn = document.getElementById('close-guide');

guideBtn.addEventListener('click', () => {
    guideModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
});

closeGuideBtn.addEventListener('click', () => {
    guideModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
});

// Close modal when clicking outside
guideModal.addEventListener('click', (e) => {
    if (e.target === guideModal) {
        guideModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
});

// Initialize source type buttons
document.querySelectorAll('.source-type-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const sourceType = this.id.replace('-btn', '');
        loadSourceForm(sourceType);
    });
});

// Generate button click handler
generateBtn.addEventListener('click', function() {
    if (!currentSourceType) {
        showAlert('Please select a source type first', 'error');
        return;
    }

    const formData = collectFormData();
    if (!validateForm(formData)) {
        return;
    }

    generateCitations(formData);
});

// Clear button click handler
clearBtn.addEventListener('click', function() {
    citationForm.innerHTML = '';
    citationForm.appendChild(formPlaceholder);
    currentSourceType = null;
    resultsSection.classList.add('hidden');
    citationResults.innerHTML = '';
});

// Copy all button click handler
copyAllBtn.addEventListener('click', function() {
    const citations = Array.from(document.querySelectorAll('.citation-text')).map(el => el.textContent);
    if (citations.length === 0) {
        showAlert('No citations to copy', 'error');
        return;
    }

    const textToCopy = citations.join('\n\n');
    navigator.clipboard.writeText(textToCopy)
        .then(() => showAlert('All citations copied to clipboard!', 'success'))
        .catch(err => showAlert('Failed to copy citations', 'error'));
});

// Export button click handler
exportBtn.addEventListener('click', function() {
    const citations = Array.from(document.querySelectorAll('.citation-text')).map(el => el.textContent);
    if (citations.length === 0) {
        showAlert('No citations to export', 'error');
        return;
    }

    const style = citationStyleSelect.options[citationStyleSelect.selectedIndex].text;
    const sourceType = currentSourceType ? sourceTemplates[currentSourceType].name : 'Unknown Source';
    
    let exportText = `Academic Citation Generator Export\n`;
    exportText += `Generated on: ${new Date().toLocaleString()}\n`;
    exportText += `Citation Style: ${style}\n`;
    exportText += `Source Type: ${sourceType}\n\n`;
    exportText += citations.join('\n\n');

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citations_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Load form for selected source type
function loadSourceForm(sourceType) {
    currentSourceType = sourceType;
    const template = sourceTemplates[sourceType];
    
    // Clear form
    citationForm.innerHTML = '';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'flex items-center mb-6';
    header.innerHTML = `
        <i class="fas fa-${template.icon} text-2xl text-blue-600 mr-3"></i>
        <h3 class="text-xl font-semibold text-gray-800">${template.name} Details</h3>
    `;
    citationForm.appendChild(header);
    
    // Add fields
    template.fields.forEach(field => {
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'mb-4 relative';
        
        const input = document.createElement('input');
        input.type = field.type || 'text';
        input.id = field.id;
        input.name = field.id;
        input.placeholder = ' ';
        input.className = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
        if (field.required) {
            input.required = true;
        }
        
        const label = document.createElement('label');
        label.htmlFor = field.id;
        label.className = 'floating-label absolute left-4 top-1/2 bg-white px-1 text-gray-500 pointer-events-none';
        label.textContent = field.label;

        // Add author format instruction and add button for author/inventor/creator fields
        if (['author', 'inventor', 'creator'].includes(field.id)) {
            const instruction = document.createElement('div');
            instruction.className = 'text-xs text-gray-500 mt-1';
            instruction.textContent = 'Enter multiple authors as "Lastname, Initial. & Lastname, Initial." (e.g., "Smith, J. & Doe, J.")';
            fieldGroup.appendChild(instruction);

            // Add "Add Author" button
            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center';
            addButton.innerHTML = '<i class="fas fa-plus-circle mr-1"></i> Add Another Author';
            addButton.addEventListener('click', () => addAuthorField(fieldGroup, field.id));
            fieldGroup.appendChild(addButton);
        }
        
        fieldGroup.appendChild(input);
        fieldGroup.appendChild(label);
        citationForm.appendChild(fieldGroup);
    });
    
    // Scroll to form
    citationForm.scrollIntoView({ behavior: 'smooth' });
}

// Function to add additional author field
function addAuthorField(container, fieldId) {
    const newField = document.createElement('div');
    newField.className = 'mt-3 relative';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `${fieldId}_${Date.now()}`;
    input.name = fieldId;
    input.placeholder = ' ';
    input.className = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.className = 'floating-label absolute left-4 top-1/2 bg-white px-1 text-gray-500 pointer-events-none';
    label.textContent = 'Additional Author';
    
    newField.appendChild(input);
    newField.appendChild(label);
    container.appendChild(newField);
}

// Collect form data
function collectFormData() {
    const formData = {};
    const inputs = citationForm.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        const baseId = input.id.split('_')[0]; // Handle additional author fields
        if (!formData[baseId]) {
            formData[baseId] = input.value.trim();
        } else {
            formData[baseId] += ` & ${input.value.trim()}`;
        }
    });
    
    return formData;
}

// Validate form
function validateForm(formData) {
    const requiredFields = sourceTemplates[currentSourceType].fields.filter(f => f.required);
    
    for (const field of requiredFields) {
        if (!formData[field.id] || formData[field.id].trim() === '') {
            showAlert(`Please fill in the "${field.label}" field`, 'error');
            document.getElementById(field.id).focus();
            return false;
        }
    }
    
    return true;
}

// Generate citations
function generateCitations(formData) {
    loadingElement.classList.remove('hidden');
    
    // Simulate AI processing delay
    setTimeout(() => {
        loadingElement.classList.add('hidden');
        
        // Clear previous results
        citationResults.innerHTML = '';
        
        // Generate citations for all styles
        const style = citationStyleSelect.value;
        const fullCitation = citationGenerators[style].full(currentSourceType, formData);
        const inTextCitation = citationGenerators[style].intext(currentSourceType, formData);
        
        // Display results
        const resultCard = createCitationCard(style, fullCitation, inTextCitation);
        citationResults.appendChild(resultCard);
        
        // Show results section
        resultsSection.classList.remove('hidden');
        resultsSection.scroll-intoView({ behavior: 'smooth' });
    }, 1500);
}

// Create citation card
function createCitationCard(style, fullCitation, inTextCitation) {
    const styleName = {
        apa: 'APA (7th Edition)',
        mla: 'MLA (9th Edition)',
        chicago: 'Chicago (17th Edition)',
        harvard: 'Harvard',
        ieee: 'IEEE'
    }[style];
    
    const card = document.createElement('div');
    card.className = 'citation-result bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500';
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="flex items-center">
                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">${styleName}</span>
            </div>
            <div class="flex space-x-2">
                <button class="copy-btn bg-gray-100 hover:bg-gray-200 text-gray-800 p-2 rounded-full">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="intext-btn bg-gray-100 hover:bg-gray-200 text-gray-800 p-2 rounded-full">
                    <i class="fas fa-quote-left"></i>
                </button>
            </div>
        </div>
        <div class="citation-text text-gray-700 leading-relaxed">${fullCitation}</div>
        <div id="intext-${style}" class="hidden mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 class="text-sm font-semibold text-gray-600 mb-1">In-text Reference:</h4>
            <div class="intext-citation text-gray-700">${inTextCitation}</div>
        </div>
    `;
    
    // Add copy button functionality
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(citation)
            .then(() => {
                const icon = copyBtn.querySelector('i');
                icon.className = 'fas fa-check text-green-500';
                setTimeout(() => {
                    icon.className = 'fas fa-copy';
                }, 2000);
            })
            .catch(err => showAlert('Failed to copy citation', 'error'));
    });
    
    // Add in-text button functionality
    const intextBtn = card.querySelector('.intext-btn');
    const intextDiv = card.querySelector(`#intext-${style}`);
    
    intextBtn.addEventListener('click', function() {
        intextDiv.classList.toggle('hidden');
        const icon = intextBtn.querySelector('i');
        if (intextDiv.classList.contains('hidden')) {
            icon.className = 'fas fa-quote-left';
        } else {
            icon.className = 'fas fa-quote-right';
        }
    });
    
    return card;
}

// Show alert message
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
    }`;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Citation generators
function generateAPACitation(sourceType, data) {
    switch(sourceType) {
        case 'journal':
            return `${formatAuthorsAPA(data.author)} (${data.year}). ${data.title}. ${data.journal}, ${data.volume || ''}${data.issue ? `(${data.issue})` : ''}${data.pages ? `, ${data.pages}` : ''}.${data.doi ? ` https://doi.org/${data.doi}` : ''}`;
        
        case 'conference':
            return `${formatAuthorsAPA(data.author)} (${data.year}, ${data.date ? formatDate(data.date, 'month') + ' ' : ''}${data.year}). ${data.title}. ${data.conference}${data.location ? `, ${data.location}` : ''}.${data.doi ? ` https://doi.org/${data.doi}` : ''}`;
        
        case 'thesis':
            return `${formatAuthorsAPA(data.author)} (${data.year}). ${data.title} [${data.degree}, ${data.institution}].${data.url ? ` ${data.url}` : ''}`;
        
        case 'website':
            const accessDate = data.access ? ` Retrieved ${formatDate(data.access, 'long')}` : '';
            return `${data.author ? `${formatAuthorsAPA(data.author)} ` : ''}(${data.year ? data.year : 'n.d.'}). ${data.title}. ${data.site}.${data.url ? ` ${data.url}` : ''}${accessDate}.`;
        
        case 'book':
            return `${formatAuthorsAPA(data.author)} (${data.year}). ${data.title}${data.edition ? ` (${data.edition})` : ''}. ${data.publisher}.`;
        
        default:
            return `APA citation for ${sourceType} would appear here with the provided data.`;
    }
}

function formatAuthorsAPA(authors) {
    if (!authors) return '';
    
    const authorList = authors.split('&').map(a => a.trim());
    if (authorList.length === 1) {
        return authorList[0];
    }
    
    return authorList.slice(0, -1).join(', ') + ', & ' + authorList[authorList.length - 1];
}

function generateMLACitation(sourceType, data) {
    switch(sourceType) {
        case 'journal':
            return `${data.author}. "${data.title}." ${data.journal}, vol. ${data.volume || ''}${data.issue ? `, no. ${data.issue}` : ''}, ${data.year}${data.pages ? `, pp. ${data.pages}` : ''}.${data.doi ? `, doi:${data.doi}` : ''}`;
        
        case 'conference':
            return `${data.author}. "${data.title}." ${data.conference}, ${data.location ? `${data.location}, ` : ''}${data.year}.${data.doi ? ` doi:${data.doi}` : ''}`;
        
        case 'thesis':
            return `${data.author}. "${data.title}." ${data.degree}, ${data.institution}, ${data.year}.${data.url ? `, ${data.url}` : ''}`;
        
        case 'website':
            const accessDate = data.access ? ` Accessed ${formatDate(data.access, 'long')}.` : '';
            return `${data.author ? `${data.author}. ` : ''}"${data.title}." ${data.site}, ${data.year ? data.year : 'n.d.'}.${data.url ? ` ${data.url}.` : ''}${accessDate}`;
        
        case 'book':
            return `${data.author}. ${data.title}${data.edition ? `. ${data.edition}` : ''}. ${data.publisher}, ${data.year}.${data.isbn ? ` ISBN ${data.isbn}.` : ''}`;
        default:
            return `MLA citation for ${sourceType} would appear here with the provided data.`;
    }
}

function generateChicagoCitation(sourceType, data) {
    switch(sourceType) {
        case 'journal':
            return `${data.author}, "${data.title}," ${data.journal} ${data.volume || ''}${data.issue ? `, no. ${data.issue}` : ''} (${data.year}): ${data.pages || ''}.${data.doi ? ` https://doi.org/${data.doi}` : ''}`;
        
        case 'conference':
            return `${data.author}, "${data.title}" (Paper presented at ${data.conference}, ${data.location}, ${data.year}).${data.doi ? ` https://doi.org/${data.doi}` : ''}`;
        
        case 'thesis':
            return `${data.author}, "${data.title}" (${data.degree}, ${data.institution}, ${data.year}).${data.url ? ` ${data.url}` : ''}`;
        
        case 'website':
            const accessDate = data.access ? ` Accessed ${formatDate(data.access, 'long')}.` : '';
            return `${data.author ? `${data.author}. ` : ''}"${data.title}." ${data.site}. ${data.year ? data.year : 'n.d.'}.${data.url ? ` ${data.url}.` : ''}${accessDate}`;
        
        case 'book':
            return `${data.author}. ${data.title}${data.edition ? `. ${data.edition}` : ''}. ${data.location}: ${data.publisher}, ${data.year}.${data.isbn ? ` ISBN: ${data.isbn}.` : ''}`;
        default:
            return `Chicago citation for ${sourceType} would appear here with the provided data.`;
    }
}

function generateHarvardCitation(sourceType, data) {
    switch(sourceType) {
        case 'journal':
            return `${data.author} (${data.year}) '${data.title}', ${data.journal}, ${data.volume || ''}${data.issue ? `(${data.issue})` : ''}${data.pages ? `, pp. ${data.pages}` : ''}.${data.doi ? ` doi: ${data.doi}` : ''}`;
        
        case 'conference':
            return `${data.author} (${data.year}) '${data.title}', paper presented to ${data.conference}, ${data.location}, ${formatDate(data.date, 'long')}.${data.doi ? ` doi: ${data.doi}` : ''}`;
        
        case 'thesis':
            return `${data.author} (${data.year}) '${data.title}', ${data.degree}, ${data.institution}.${data.url ? ` Available at: ${data.url}` : ''}`;
        
        case 'website':
            const accessDate = data.access ? ` [Accessed ${formatDate(data.access, 'long')}]` : '';
            return `${data.author ? `${data.author} ` : ''}(${data.year ? data.year : 'n.d.'}) '${data.title}', ${data.site}.${data.url ? ` Available at: ${data.url}` : ''}${accessDate}.`;
        
        case 'book':
            return `${data.author} (${data.year}) ${data.title}${data.edition ? `, ${data.edition}` : ''}. ${data.location}: ${data.publisher}.${data.isbn ? ` ISBN: ${data.isbn}.` : ''}`;
        default:
            return `Harvard citation for ${sourceType} would appear here with the provided data.`;
    }
}

function generateIEEECitation(sourceType, data) {
    switch(sourceType) {
        case 'journal':
            return `${data.author}, "${data.title}," ${data.journal}, vol. ${data.volume || ''}, no. ${data.issue || ''}, pp. ${data.pages || ''}, ${data.month ? `${formatDate(data.date, 'month')} ` : ''}${data.year}.${data.doi ? ` doi: ${data.doi}.` : ''}`;
        
        case 'conference':
            return `${data.author}, "${data.title}," in ${data.conference}, ${data.location}, ${data.year}, pp. ${data.pages || ''}.${data.doi ? ` doi: ${data.doi}.` : ''}`;
        
        case 'thesis':
            return `${data.author}, "${data.title}," ${data.degree}, ${data.institution}, ${data.location}, ${data.year}.${data.url ? ` [Online]. Available: ${data.url}` : ''}`;
        
        case 'website':
            return `${data.author ? `${data.author}, ` : ''}"${data.title}," ${data.site}, ${data.year ? data.year : 'n.d.'}. [Online]. Available: ${data.url}. [Accessed: ${data.access ? formatDate(data.access, 'short') : 'n.d.'}].`;
        
        case 'book':
            return `${data.author}, ${data.title}${data.edition ? `, ${data.edition}` : ''}. ${data.location}: ${data.publisher}, ${data.year}.${data.isbn ? ` [Online]. Available: ISBN ${data.isbn}.` : ''}`;
        default:
            return `IEEE citation for ${sourceType} would appear here with the provided data.`;
    }
}

// In-text citation generators
function generateAPAInText(sourceType, data) {
    if (!data.author) return `("Title", ${data.year})`;
    
    const authors = data.author.split('&').map(a => a.trim());
    const lastNames = authors.map(a => a.split(',')[0].trim());
    
    if (authors.length === 1) {
        return `(${lastNames[0]}, ${data.year})`;
    } else if (authors.length === 2) {
        return `(${lastNames[0]} & ${lastNames[1]}, ${data.year})`;
    } else {
        return `(${lastNames[0]} et al., ${data.year})`;
    }
}

function generateMLAInText(sourceType, data) {
    const authors = data.author.split('&')[0].trim(); // Take first author only
    const lastName = authors.split(',')[0].trim();
    return `(${lastName} ${data.pages ? data.pages.split('-')[0] : ''})`;
}

function generateChicagoInText(sourceType, data) {
    const authors = data.author.split('&')[0].trim(); // Take first author only
    const lastName = authors.split(',')[0].trim();
    return `(${lastName} ${data.year}, ${data.pages ? data.pages.split('-')[0] : ''})`;
}

function generateHarvardInText(sourceType, data) {
    const authors = data.author.split('&')[0].trim(); // Take first author only
    const lastName = authors.split(',')[0].trim();
    return `(${lastName} ${data.year})`;
}

function generateIEEEInText(sourceType, data) {
    const authors = data.author.split('&')[0].trim(); // Take first author only
    const lastName = authors.split(',')[0].trim();
    return `[${lastName.charAt(0)}${data.year.toString().slice(-2)}]`;
}

// Helper function to format dates
function formatDate(dateString, format = 'short') {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    if (format === 'long') {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    } else if (format === 'month') {
        return date.toLocaleString('en-US', { month: 'short' });
    } else {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}