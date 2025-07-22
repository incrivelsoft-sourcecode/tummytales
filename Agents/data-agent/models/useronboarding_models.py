from typing import Optional, Dict, List
from pydantic import BaseModel, Field, EmailStr
import uuid
from datetime import datetime

# ----------------------------
# Referral Model (Nested inside UserDetails)
# ----------------------------
class ReferralModel(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    referal_email: EmailStr
    permissions: List[str]
    role: str = "supporter"
    relation: Optional[str] = ""
    status: str = "pending"
    referal_code: Optional[str] = None
    sentAt: Optional[datetime] = None
    resentCount: Optional[int] = 0

# ----------------------------
# UserDetails Model
# ----------------------------
class UserDetailsModel(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_name: str
    email: EmailStr
    password: Optional[str] = None
    googleId: Optional[str] = None
    facebookId: Optional[str] = None
    role: Optional[str] = "mom"
    referal_code: Optional[str] = None
    referals: Optional[List[ReferralModel]] = []
    isActive: Optional[bool] = False
    permissions: Optional[List[str]] = []
    status: Optional[str] = "unverified"
    otp: Optional[str] = None
    otpExpiresAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None

# ----------------------------
# MomProfile Sub-Models
# ----------------------------

class PregnancyLossDetails(BaseModel):
    dateOfLoss: Optional[datetime]
    reason: Optional[str]
    gestationWeeks: Optional[int]
    treatmentLocation: Optional[str]

class PregnancyLossInfo(BaseModel):
    hasPregnancyLoss: bool = False
    details: Optional[PregnancyLossDetails] = None

class MedicationDetails(BaseModel):
    name: Optional[str]
    dosage: Optional[str]
    frequency: Optional[str]
    
class FirstChildDetails(BaseModel):
    dob: Optional[datetime]
    complications: Optional[str]
    deliverymethod: Optional[str]
    childbornlocation: Optional[str]
    gestationalAgeAtBirth: Optional[str]

class FirstChildInfo(BaseModel):
    isFirstChild: bool = False
    details: Optional[FirstChildDetails] = None

class PregnancyStatus(BaseModel):
    currentlyPregnant: bool = False
    Last_menstrualperiod: Optional[datetime]
    estimatedDueDate: Optional[datetime]
    pregnancy_loss_info: Optional[PregnancyLossInfo] = None
    firstChildInfo: Optional[FirstChildInfo] = None

class AddressDetails(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    medical_office_name: Optional[str]
    country: Optional[str]
    Addressline1: Optional[str]
    Addressline2: Optional[str]
    city: Optional[str]
    State: Optional[str]
    Zip_code: Optional[str]
    Phonenumber: Optional[str]

class HealthCare(BaseModel):
    primaryCare: Optional[Dict[str, Optional[AddressDetails]]]
    obgyn: Optional[Dict[str, Optional[AddressDetails]]]
    insuranceProvider: Optional[str]
    medication1: Optional[MedicationDetails]
    medication2: Optional[MedicationDetails]
    consumesAlcoholOrSmokes: Optional[bool] = False

class GeneralDetails(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    dob: Optional[datetime]
    gender: Optional[str]
    nationality: Optional[str]
    Phonenumber: Optional[str]
    email: Optional[str]
    country: Optional[str]
    Addressline1: Optional[str]
    Addressline2: Optional[str]
    city: Optional[str]
    State: Optional[str]
    Zip_code: Optional[str]

class LifestylePreferences(BaseModel):
    preferredLanguage: Optional[str]
    dietaryPreferences: Optional[str]
    physicalActivity: Optional[str]
    primaryInfoSource: Optional[str]

class ExperienceAndExpectations(BaseModel):
    expectations: Optional[str]
    challenges: Optional[str]
    wantsPersonalizedResources: Optional[bool] = False
    additionalComments: Optional[str]

# ----------------------------
# MomProfile Model
# ----------------------------
class MomProfileModel(BaseModel):
    userId: str
    generalDetails: Optional[GeneralDetails]
    pregnancyStatus: Optional[PregnancyStatus]
    healthCare: Optional[HealthCare]
    lifestylePreferences: Optional[LifestylePreferences]
    experienceAndExpectations: Optional[ExperienceAndExpectations]
    createdAt: Optional[datetime]

# ----------------------------
# SupporterProfile Model
# ----------------------------
class SupporterProfileModel(BaseModel):
    userId: str
    first_name: Optional[str]
    last_name: Optional[str]
    dob: Optional[datetime]
    gender: Optional[str]
    nationality: Optional[str]
    Phonenumber: Optional[str]
    email: Optional[str]
    country: Optional[str]
    Addressline1: Optional[str]
    Addressline2: Optional[str]
    city: Optional[str]
    State: Optional[str]
    Zip_code: Optional[str]
    createdAt: Optional[datetime]
