# app.py
# A high-speed API for the Adult Salary Classification model.
# Built with FastAPI to serve predictions.

import uvicorn
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from sklearn.preprocessing import LabelEncoder
import joblib

# --- 1. SETUP & CONFIGURATION ---

# Initialize the FastAPI app
app = FastAPI(
    title="Salary Classification API",
    description="An API to predict whether an employee earns >50K or ≤50K.",
    version="1.1.1" # Updated version
)

# CORS Middleware to allow frontend communication
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. LOAD MODEL AND PREPROCESSORS ---

# Load the trained machine learning model
try:
    model = joblib.load("best_model.pkl")
    print("Model loaded successfully.")
except FileNotFoundError:
    print("Error: Model file 'best_model.pkl' not found.")
    model = None

# Recreate the LabelEncoders exactly as in the training notebook
encoders = {}
# --- FIX: Use underscores in keys to match DataFrame columns ---
categorical_cols_options = {
    'workclass': ['Private', 'Self-emp-not-inc', 'Local-gov', 'Others', 'State-gov', 'Self-emp-inc', 'Federal-gov'],
    'marital_status': ['Never-married', 'Married-civ-spouse', 'Divorced', 'Married-spouse-absent', 'Separated', 'Married-AF-spouse', 'Widowed'],
    'occupation': ['Prof-specialty', 'Craft-repair', 'Exec-managerial', 'Adm-clerical', 'Sales', 'Other-service', 'Machine-op-inspct', 'Others', 'Transport-moving', 'Handlers-cleaners', 'Farming-fishing', 'Tech-support', 'Protective-serv', 'Priv-house-serv', 'Armed-Forces'],
    'relationship': ['Husband', 'Not-in-family', 'Own-child', 'Unmarried', 'Wife', 'Other-relative'],
    'race': ['White', 'Black', 'Asian-Pac-Islander', 'Amer-Indian-Eskimo', 'Other'],
    'gender': ['Male', 'Female'],
    'native_country': ['United-States', 'Cuba', 'Jamaica', 'India', 'Mexico', 'South', 'Puerto-Rico', 'Honduras', 'England', 'Canada', 'Germany', 'Iran', 'Philippines', 'Poland', 'Columbia', 'Cambodia', 'Thailand', 'Ecuador', 'Laos', 'Taiwan', 'Haiti', 'Portugal', 'Dominican-Republic', 'El-Salvador', 'France', 'Guatemala', 'Italy', 'China', 'Japan', 'Yugoslavia', 'Peru', 'Outlying-US(Guam-USVI-etc)', 'Scotland', 'Trinidad&Tobago', 'Greece', 'Nicaragua', 'Vietnam', 'Hong', 'Ireland', 'Hungary', 'Holland-Netherlands']
}

for col, options in categorical_cols_options.items():
    le = LabelEncoder()
    le.fit(options)
    encoders[col] = le

print("LabelEncoders created successfully.")

# --- 3. DEFINE DATA MODELS (using Pydantic) ---

# This model defines the structure and types for the input data.
class AdultProfile(BaseModel):
    age: int = Field(..., ge=17, le=90)
    workclass: str
    fnlwgt: int = Field(..., gt=0)
    educational_num: int = Field(..., ge=1, le=16, alias='educational-num')
    marital_status: str = Field(..., alias='marital-status')
    occupation: str
    relationship: str
    race: str
    gender: str
    capital_gain: int = Field(..., ge=0, alias='capital-gain')
    capital_loss: int = Field(..., ge=0, alias='capital-loss')
    hours_per_week: int = Field(..., ge=1, le=99, alias='hours-per-week')
    native_country: str = Field(..., alias='native-country')

    model_config = ConfigDict(
        populate_by_name=True,
    )

# This model defines the structure for the prediction response.
class PredictionResponse(BaseModel):
    prediction: str
    prediction_label: int

# --- 4. API ENDPOINTS ---

@app.get("/", tags=["Root"])
def read_root():
    """A simple endpoint to check if the API is running."""
    return {"message": "Welcome to the Salary Classification API!"}

@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_salary_class(profile: AdultProfile):
    """Predicts salary class (>50K or ≤50K) based on profile data."""
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded.")

    # Create a DataFrame from the input Pydantic model
    input_df = pd.DataFrame([profile.dict()])

    # Apply the same Label Encoding as the training process
    for col, encoder in encoders.items():
        if col in input_df.columns:
            try:
                # Replace '?' with 'Others' before transforming
                if input_df[col].dtype == 'object':
                    input_df[col] = input_df[col].replace({'?': 'Others'})
                
                input_df[col] = encoder.transform(input_df[col])
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Invalid value in column '{col}': {e}")
    
    # Ensure the column order matches the Pydantic model attributes (with underscores)
    final_cols_order = [
        'age', 'workclass', 'fnlwgt', 'educational_num', 'marital_status', 
        'occupation', 'relationship', 'race', 'gender', 'capital_gain', 
        'capital_loss', 'hours_per_week', 'native_country'
    ]
    input_df = input_df[final_cols_order]

    # Make the prediction
    try:
        # Rename columns to match the model's training names
        rename_map = {
            'educational_num': 'educational-num',
            'marital_status': 'marital-status',
            'capital_gain': 'capital-gain',
            'capital_loss': 'capital-loss',
            'hours_per_week': 'hours-per-week',
            'native_country': 'native-country'
        }
        input_df.rename(columns=rename_map, inplace=True)

        # The model predicts a string ('<=50K' or '>50K'), so we capture that first.
        prediction_str = model.predict(input_df)[0]
        
        # Then, we derive the numeric label from the predicted string.
        prediction_label_numeric = 0 if prediction_str == '<=50K' else 1

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during prediction: {e}")

    return {"prediction": prediction_str, "prediction_label": prediction_label_numeric}

# --- 5. RUN THE API ---

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)
