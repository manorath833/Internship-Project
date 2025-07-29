// This function must be in the global scope to be accessible by the HTML onclick attributes.
function adjustNumber(inputId, amount) {
    const input = document.getElementById(inputId);
    if (input) {
        let currentValue = parseInt(input.value, 10);
        if (isNaN(currentValue)) {
            currentValue = 0;
        }
        input.value = Math.max(0, currentValue + amount);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- DATA & CONFIG ---
    const API_URL = 'http://127.0.0.1:8000/predict';
    const categoricalOptions = {
        'workclass': { label: 'Workclass', options: ['Private', 'Self-emp-not-inc', 'Local-gov', 'Others', 'State-gov', 'Self-emp-inc', 'Federal-gov'] },
        'marital-status': { label: 'Marital Status', options: ['Never-married', 'Married-civ-spouse', 'Divorced', 'Married-spouse-absent', 'Separated', 'Married-AF-spouse', 'Widowed'] },
        'occupation': { label: 'Occupation', options: ['Prof-specialty', 'Craft-repair', 'Exec-managerial', 'Adm-clerical', 'Sales', 'Other-service', 'Machine-op-inspct', 'Others', 'Transport-moving', 'Handlers-cleaners', 'Farming-fishing', 'Tech-support', 'Protective-serv', 'Priv-house-serv', 'Armed-Forces'] },
        'relationship': { label: 'Relationship', options: ['Husband', 'Not-in-family', 'Own-child', 'Unmarried', 'Wife', 'Other-relative'] },
        'race': { label: 'Race', options: ['White', 'Black', 'Asian-Pac-Islander', 'Amer-Indian-Eskimo', 'Other'] },
        'gender': { label: 'Gender', options: ['Male', 'Female'] },
        'native-country': { label: 'Native Country', options: ['United-States', 'Cuba', 'Jamaica', 'India', 'Mexico', 'South', 'Puerto-Rico', 'Honduras', 'England', 'Canada', 'Germany', 'Iran', 'Philippines', 'Poland', 'Columbia', 'Cambodia', 'Thailand', 'Ecuador', 'Laos', 'Taiwan', 'Haiti', 'Portugal', 'Dominican-Republic', 'El-Salvador', 'France', 'Guatemala', 'Italy', 'China', 'Japan', 'Yugoslavia', 'Peru', 'Outlying-US(Guam-USVI-etc)', 'Scotland', 'Trinidad&Tobago', 'Greece', 'Nicaragua', 'Vietnam', 'Hong', 'Ireland', 'Hungary', 'Holland-Netherlands'] }
    };

    // --- UI ELEMENT REFERENCES ---
    const form = document.getElementById('prediction-form');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');
    const initialMessage = document.getElementById('initial-message');
    const resultDisplay = document.getElementById('result-display');
    const predictedClassText = document.getElementById('predicted-class');
    const resultBox = document.getElementById('result-box');

    // --- CUSTOM DROPDOWN LOGIC ---
    function createCustomDropdown(id, label, options) {
        const containerId = `${id}-dropdown`;
        const container = document.getElementById(containerId);
        if (!container) return;

        const optionsHTML = options.map(opt =>
            `<div class="cursor-pointer px-4 py-2 hover:bg-emerald-500/20 transition text-slate-900 dark:text-slate-200" data-value="${opt}">${opt}</div>`
        ).join('');

        const dropdownHTML = `
            <label for="${id}" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">${label}</label>
            <select name="${id}" id="${id}" class="sr-only" tabindex="-1" aria-hidden="true">
                ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
            <div class="relative mt-1">
                <button type="button" id="${id}-btn" class="custom-dropdown-btn w-full flex items-center justify-between p-2.5 border border-white/10 bg-white/20 dark:bg-slate-800/50 rounded-md shadow-sm text-left text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all-smooth">
                    <span id="${id}-selected">${options[0]}</span>
                    <svg class="w-5 h-5 ml-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div id="${id}-list" class="absolute left-0 mt-1 w-full max-h-60 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 hidden">
                    ${optionsHTML}
                </div>
            </div>
        `;
        container.innerHTML = dropdownHTML;

        // Attach event listeners
        const btn = document.getElementById(`${id}-btn`);
        const list = document.getElementById(`${id}-list`);
        const selected = document.getElementById(`${id}-selected`);
        const nativeSelect = document.getElementById(id);

        btn.addEventListener('click', () => {
            list.classList.toggle('hidden');
        });

        Array.from(list.children).forEach(optionDiv => {
            optionDiv.addEventListener('click', () => {
                const value = optionDiv.getAttribute('data-value');
                selected.textContent = value;
                nativeSelect.value = value;
                list.classList.add('hidden');
            });
        });

        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !list.contains(e.target)) {
                list.classList.add('hidden');
            }
        });
    }

    // --- INITIALIZE ALL DROPDOWNS ---
    for (const [id, data] of Object.entries(categoricalOptions)) {
        createCustomDropdown(id, data.label, data.options);
    }

    // --- THEME/DARK MODE LOGIC ---
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    function updateThemeIcons(isDark) {
        if (themeToggleDarkIcon && themeToggleLightIcon) {
            themeToggleDarkIcon.classList.toggle('hidden', !isDark);
            themeToggleLightIcon.classList.toggle('hidden', isDark);
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            htmlEl.classList.toggle('dark');
            const isDarkNow = htmlEl.classList.contains('dark');
            updateThemeIcons(isDarkNow);
            localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
        });
    }

    function setInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        let isDark = savedTheme ? savedTheme === 'dark' : (prefersDark || true);

        if (isDark) {
            htmlEl.classList.add('dark');
        } else {
            htmlEl.classList.remove('dark');
        }
        updateThemeIcons(isDark);
    }
    setInitialTheme();

    // --- FORM SUBMISSION LOGIC ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            setLoading(true);
            initialMessage.classList.remove('hidden');
            resultDisplay.classList.add('hidden');

            const formData = new FormData(form);
            const data = {};
            for (const [key, value] of formData.entries()) {
                const inputEl = document.getElementById(key);
                if (inputEl && inputEl.type === 'number') {
                    data[key] = parseInt(value, 10) || 0;
                } else {
                    data[key] = value;
                }
            }

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => {
                        return { detail: `Server responded with status: ${response.status}` };
                    });
                    
                    // --- FIX: Properly parse FastAPI validation errors ---
                    let errorMessage = 'An unknown error occurred.';
                    if (errorData.detail) {
                        if (Array.isArray(errorData.detail)) {
                            // It's a validation error, format it nicely.
                            const firstError = errorData.detail[0];
                            const field = firstError.loc[firstError.loc.length - 1];
                            errorMessage = `Invalid input for '${field}': ${firstError.msg}`;
                        } else {
                            // It's a regular string error message.
                            errorMessage = errorData.detail;
                        }
                    }
                    throw new Error(errorMessage);
                }

                const result = await response.json();
                displayResult(result);

            } catch (error) {
                displayError(error);
            } finally {
                setLoading(false);
            }
        });
    }

    // --- KEYBOARD CONTROLS FOR NUMBER INPUTS ---
    const numberInputs = document.querySelectorAll('input[type="number"]');
    const stepMap = {
        'age': 1,
        'educational-num': 1,
        'hours-per-week': 1,
        'fnlwgt': 1000,
        'capital-gain': 100,
        'capital-loss': 100
    };

    numberInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            const step = stepMap[e.target.id] || 1;
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                adjustNumber(e.target.id, step);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                adjustNumber(e.target.id, -step);
            }
        });
    });

    // --- UI UPDATE FUNCTIONS ---
    function setLoading(isLoading) {
        if(spinner) spinner.classList.toggle('hidden', !isLoading);
        if(buttonText) buttonText.classList.toggle('hidden', isLoading);
        if (form) {
            const submitButton = form.querySelector('button[type="submit"]');
            if(submitButton) submitButton.disabled = isLoading;
        }
    }

    function displayResult(result) {
        if(initialMessage) initialMessage.classList.add('hidden');
        if(resultDisplay) resultDisplay.classList.remove('hidden');
        if(predictedClassText) predictedClassText.textContent = result.prediction;

        if (resultBox) {
            if (result.prediction_label === 1) { // >50K
                resultBox.className = 'mt-4 p-6 rounded-lg w-full max-w-sm mx-auto border bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
            } else { // <=50K
                resultBox.className = 'mt-4 p-6 rounded-lg w-full max-w-sm mx-auto border bg-amber-500/10 border-amber-500/30 text-amber-300';
            }
        }
    }

    function displayError(error) {
        if(initialMessage) initialMessage.classList.add('hidden');
        if(resultDisplay) resultDisplay.classList.remove('hidden');
        if(predictedClassText) predictedClassText.textContent = 'Error';
        if(resultBox) resultBox.className = 'mt-4 p-6 rounded-lg w-full max-w-sm mx-auto border bg-red-500/10 border-red-500/30 text-red-300';

        let errorP = resultBox ? resultBox.querySelector('.error-message') : null;
        if (resultBox && !errorP) {
            errorP = document.createElement('p');
            errorP.className = 'text-sm mt-2 text-red-400 error-message';
            resultBox.appendChild(errorP);
        }

        if (errorP) {
            if (error instanceof Error) {
                errorP.textContent = error.message;
            } else if (typeof error === 'string') {
                errorP.textContent = error;
            } else {
                errorP.textContent = 'An unexpected error occurred.';
            }
        }
    }
});
