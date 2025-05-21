from pydantic import BaseModel

class AskAmmaQuery(BaseModel):
    age: str
    weight: str
    height_ft: str
    height_in: str
    gestational_age: str
    symptoms: str
    allergies: str
    medications: str
    blood_test: str
    urine_test: str
    diabetes_test: str
    culture: str
    location: str
    question: str