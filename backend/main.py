import hmac
import hashlib
import time
import uuid
import os
import base64
from datetime import datetime, timedelta
from typing import Annotated


import httpx
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

# ================= CONFIG =================

IMAGEKIT_PRIVATE_KEY  = os.getenv("IMAGEKIT_PRIVATE_KEY")
IMAGEKIT_PUBLIC_KEY   = os.getenv("IMAGEKIT_PUBLIC_KEY")
IMAGEKIT_URL_ENDPOINT = os.getenv("IMAGEKIT_URL_ENDPOINT")

JWT_SECRET       = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM    = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", 24))

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME   = os.getenv("DB_NAME", "cloudkitt")

IMAGEKIT_API_BASE = "https://api.imagekit.io/v1"
IK_AUTH_HEADER = base64.b64encode(f"{IMAGEKIT_PRIVATE_KEY}:".encode()).decode()

# ================= DB =================

mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

users_col = db["users"]

# ================= APP =================

app = FastAPI(title="CloudKit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ================= MODELS =================

class RegisterRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class RenameRequest(BaseModel):
    file_id: str
    new_name: str

# ================= AUTH =================

def hash_password(password: str):
    return pwd_ctx.hash(password)

def verify_password(plain, hashed):
    return pwd_ctx.verify(plain, hashed)

def create_jwt(username: str):
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)

    return jwt.encode(
        {
            "sub": username,
            "exp": expire
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        username = payload.get("sub")

        user = users_col.find_one({"username": username})

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User tidak ditemukan"
            )

        return username

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Token tidak valid"
        )

# ================= AUTH ENDPOINT =================

@app.post("/auth/register")
def register(req: RegisterRequest):

    existing = users_col.find_one(
        {"username": req.username}
    )

    if existing:
        raise HTTPException(
            400,
            "Username sudah ada"
        )

    users_col.insert_one({

        "username": req.username,

        "password": hash_password(req.password)

    })

    token = create_jwt(req.username)

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@app.post("/auth/login")
def login(form: Annotated[
    OAuth2PasswordRequestForm,
    Depends()
]):

    user = users_col.find_one({
        "username": form.username
    })

    if not user:

        raise HTTPException(
            401,
            "User tidak ditemukan"
        )

    if not verify_password(

        form.password,
        user["password"]

    ):

        raise HTTPException(
            401,
            "Password salah"
        )

    token = create_jwt(form.username)

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/auth/me")
def me(
    username: Annotated[
        str,
        Depends(get_current_user)
    ]
):

    return {
        "username": username
    }

# ================= IMAGEKIT AUTH =================

@app.get("/imagekit/auth")
def imagekit_auth(

    username: Annotated[
        str,
        Depends(get_current_user)
    ]
):

    token  = str(uuid.uuid4())

    expire = int(time.time()) + 1800

    signature = hmac.new(

        IMAGEKIT_PRIVATE_KEY.encode(),

        (token + str(expire)).encode(),

        hashlib.sha1

    ).hexdigest()

    safe_username = username.replace("@","_").replace(".","_")

    return {

        "token": token,

        "expire": expire,

        "signature": signature,

        "publicKey": IMAGEKIT_PUBLIC_KEY,

        "urlEndpoint": IMAGEKIT_URL_ENDPOINT,

        "folder": f"/uploads/{safe_username}"

    }

# ================= FILE LIST =================

@app.get("/files")
async def list_files(

    username: Annotated[
        str,
        Depends(get_current_user)
    ],

    search: str = "",

    sort: str = "DESC_CREATED",

    file_type: str = ""

):

    safe_username = username.replace("@","_").replace(".","_")

    folder_path = f"/uploads/{safe_username}"

    params = {

        "path": folder_path,

        "limit": 200,

        "sort": sort

    }

    if search:

        params["name"] = search

    if file_type:

        params["fileType"] = file_type

    async with httpx.AsyncClient() as client:

        resp = await client.get(

            f"{IMAGEKIT_API_BASE}/files",

            headers={

                "Authorization":

                f"Basic {IK_AUTH_HEADER}"

            },

            params=params

        )

    if resp.status_code != 200:

        raise HTTPException(

            502,

            "Gagal mengambil file"

        )

    raw = resp.json()

    files = []

    for f in raw:

        files.append({

            "fileId": f["fileId"],

            "name": f["name"],

            "url": f["url"],

            "size": f.get("size",0),

            "fileType": f.get("fileType"),

            "mimeType": f.get("mime"),

            "createdAt": f.get("createdAt"),

            "thumbnail": f.get(

                "thumbnailUrl",

                f["url"]

            )

        })

    return {

        "files": files,

        "total": len(files)

    }

# ================= DELETE =================

@app.delete("/files/{file_id}")
async def delete_file(

    file_id: str,

    username: Annotated[
        str,
        Depends(get_current_user)
    ]
):

    async with httpx.AsyncClient() as client:

        resp = await client.delete(

            f"{IMAGEKIT_API_BASE}/files/{file_id}",

            headers={

                "Authorization":

                f"Basic {IK_AUTH_HEADER}"

            }

        )

    if resp.status_code not in (200,204):

        raise HTTPException(

            502,

            "Gagal hapus file"

        )

    return {"success": True}

# ================= RENAME =================

@app.patch("/files/{file_id}/rename")
async def rename_file(

    file_id: str,

    body: RenameRequest,

    username: Annotated[
        str,
        Depends(get_current_user)
    ]
):

    async with httpx.AsyncClient() as client:

        resp = await client.patch(

            f"{IMAGEKIT_API_BASE}/files/{file_id}",

            headers={

                "Authorization":

                f"Basic {IK_AUTH_HEADER}"

            },

            json={

                "name": body.new_name

            }

        )

    if resp.status_code != 200:

        raise HTTPException(

            502,

            "Gagal rename"

        )

    return {

        "success": True,

        "fileId": file_id,

        "name": body.new_name

    }

# ================= HEALTH =================

@app.get("/health")
def health():

    return {"status":"ok"}

print("MONGO_URL:", MONGO_URL)
client = MongoClient(MONGO_URL)
print("CONNECTED")