# Salary Predictor Web Application

## 📖 Overview

This project is a full-stack web application that predicts whether an individual's annual income is greater than or less than $50,000. It uses a machine learning model trained on the Adult Census Income dataset.

The application features an interactive frontend built with HTML, CSS, and JavaScript, and a high-performance backend API built with Python and FastAPI to serve the model's predictions in real-time.

## ✨ Key Features

- **Interactive UI**: A modern, responsive user interface built with Tailwind CSS.
- **Dynamic Form**: Custom-built dropdowns and number inputs with interactive controls (buttons and arrow keys).
- **Dark/Light Mode**: A theme toggle for user preference.
- **Real-time Predictions**: Instantly get salary class predictions without a page reload.
- **FastAPI Backend**: A robust and high-speed Python backend to serve the machine learning model.
- **Data Analysis Notebook**: A complete Jupyter Notebook (`Analysis_model.ipynb`) detailing the data cleaning, feature engineering, and model training process.

## 🛠️ Tech Stack

- **Frontend**:
  - HTML5
  - CSS3 (with Tailwind CSS)
  - JavaScript (ES6+)

- **Backend**:
  - Python 3
  - FastAPI
  - Uvicorn (ASGI Server)

- **Machine Learning & Data Science**:
  - Scikit-learn
  - Pandas
  - Joblib
  - Jupyter Notebook

## 🚀 Setup and Installation

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

- Python 3.8 or newer
- A web browser (e.g., Chrome, Firefox)

### 2. Clone the Repository

Clone this repository to your local machine:
```bash
git clone <your-repository-url>
cd <project-directory>

3. Set Up a Virtual Environment
It's highly recommended to use a virtual environment to manage project dependencies.

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

4. Install Dependencies
Create a file named requirements.txt and add the following lines:

fastapi
uvicorn[standard]
scikit-learn
pandas
joblib

Now, install all the required Python packages using pip:

pip install -r requirements.txt

5. Run the Application
You need to run the backend server first.

Start the Backend API:
In your terminal, run the following command to start the FastAPI server:

uvicorn app:app --reload

The server will start, typically on http://127.0.0.1:8000. Keep this terminal window open.

Launch the Frontend:
Open the index.html file in your web browser. You can usually do this by double-clicking the file.

💻 How to Use
Make sure the backend uvicorn server is running.

Open index.html in your browser.

Fill in the form with the required demographic and employment details.

Click the "Predict Salary" button.

The predicted salary class (<=50K or >50K) will be displayed in the result panel on the right.

📁 Project Structure
.
├── 📂 static/
│   ├── 📄 style.css         # Custom CSS styles
│   └── 📄 script.js         # Frontend JavaScript logic
├── 📄 index.html            # Main HTML file for the user interface
├── 📄 app.py                # FastAPI backend server
├── 📄 Analysis_model.ipynb  # Jupyter Notebook for model training
├── 📄 best_model.pkl        # Pre-trained Gradient Boosting model
├── 📄 adult 3.csv           # Dataset used for training
└── 📄 README.md             # This file
