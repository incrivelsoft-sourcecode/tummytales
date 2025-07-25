from fastapi import Header, HTTPException, Depends
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "your_default_secret_key")

async def decode_jwt(authorization: str = Header(...)):
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid token format")
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

        user_id = payload.get("userId")
        if not user_id:
            raise HTTPException(status_code=401, detail="userId missing in token")

        return user_id  # ✅ returning user_id correctly
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token")











# main
# from fastapi import Header, HTTPException, Depends
# from jose import jwt, JWTError
# import os
# from dotenv import load_dotenv

# load_dotenv()  # Load JWT_SECRET from .env if you're using it

# JWT_SECRET = os.getenv("JWT_SECRET", "your_default_secret_key")  # fallback

# async def decode_jwt(authorization: str = Header(...)):
#     try:
#         # Token comes as "Bearer <token>", so we split it
#         if not authorization.startswith("Bearer "):
#             raise HTTPException(status_code=401, detail="Invalid token format")

#         token = authorization.split(" ")[1]
#         payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

#         user_id = payload.get("userId")  # make sure this matches your token payload
#         if not user_id:
#             raise HTTPException(status_code=401, detail="userId missing in token")

#         return user_id

#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code=401, detail="Token expired")
#     except jwt.InvalidTokenError:
#         raise HTTPException(status_code=401, detail="Invalid token")


