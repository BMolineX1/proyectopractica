# app/routers/usuarios.py
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File
from sqlalchemy.orm import Session
import os, uuid
from app import models, schemas
from app.dependencies import get_db
from app.auth import get_current_user, create_access_token  # ⬅️ IMPORTANTE
from app.utils.emprendedor import ensure_emprendedor_for_user
from app.auth import create_access_token, get_current_user
from sqlalchemy.exc import IntegrityError
import bcrypt

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


#########   FOTO ##########



AVATAR_DIR = "uploads/avatars"  # asegurate de crear la carpeta

@router.post("/{usuario_id}/avatar")
def subir_avatar(
    usuario_id: int,
    avatar: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    if current_user.id != usuario_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    ext = os.path.splitext(avatar.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Formato no soportado")

    os.makedirs(AVATAR_DIR, exist_ok=True)
    fname = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(AVATAR_DIR, fname)

    with open(path, "wb") as f:
      f.write(avatar.file.read())

    # Si guardás la ruta en la DB:
    # current_user.avatar_path = path
    # db.commit(); db.refresh(current_user)

    # Exponé una URL según cómo sirvas estáticos (ej: /static/avatars/...)
    return {"avatar_url": f"/{path}"}

# ===========================
# Registro
# ===========================
@router.post("/registro")
def sign_up(request_data: schemas.RegisterSchema, db: Session = Depends(get_db)):
    existe = (
        db.query(models.Usuario)
        .filter(
            (models.Usuario.username == request_data.username)
            | (models.Usuario.email == request_data.email)
        )
        .first()
    )
    if existe:
        raise HTTPException(status_code=400, detail="Usuario o email ya existe")

    # Hasheamos y GUARDAMOS como string para evitar confusiones
    hashed_bytes = bcrypt.hashpw(request_data.password.encode("utf-8"), bcrypt.gensalt())
    hashed_str = hashed_bytes.decode("utf-8")  # ← guardamos str

    nuevo_usuario = models.Usuario(
        email=request_data.email,
        username=request_data.username,
        password=hashed_str,           # ← str
        rol=request_data.rol or "cliente",
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    schema = schemas.UsuarioResponse.model_validate(nuevo_usuario)
    return {"message": schema}


# ===========================
# Login
# ===========================
@router.post("/login")
def login(request_data: schemas.LoginSchema, db: Session = Depends(get_db)):
    user = (
        db.query(models.Usuario)
        .filter(models.Usuario.username == request_data.username)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario o contraseña incorrectos",
        )

    # user.password puede venir como str (recomendado) o bytes (datos antiguos)
    stored = user.password
    if isinstance(stored, str):
        stored_bytes = stored.encode("utf-8")
    else:
        stored_bytes = stored  # ya es bytes

    ok = bcrypt.checkpw(request_data.password.encode("utf-8"), stored_bytes)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario o contraseña incorrectos",
        )

    schema = schemas.UsuarioResponse.model_validate(user)
    token = create_access_token({
        "sub": user.id,            # create_access_token ya lo castea a str
        "username": user.username,
        "rol": user.rol,
    })

    # El front espera user_schema y token
    return {"user_schema": schema, "token": token}

# ===========================
# Perfil (protegido)
# ===========================
@router.get("/perfil")
def get_profile_info(current_user: models.Usuario = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "rol": current_user.rol,
        # NUEVO:
        "nombre": getattr(current_user, "nombre", None),
        "apellido": getattr(current_user, "apellido", None),
        "dni": getattr(current_user, "dni", None),
        # opcional si más adelante guardás la foto en DB:
        # "avatar_url": f"/{current_user.avatar_path}" if getattr(current_user, "avatar_path", None) else None,
    }


# ===========================
# Activar emprendedor (protegido)
# ===========================
@router.put("/{usuario_id}/activar_emprendedor")
def activar_emprendedor(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    if current_user.id != usuario_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if usuario.rol != "emprendedor":
        usuario.rol = "emprendedor"
        db.commit()
        db.refresh(usuario)

    # ⬇️ CREA (si no existe) y asegura nombre no-nulo
    e = ensure_emprendedor_for_user(db, usuario.id)

    token = create_access_token({
        "sub": str(usuario.id),
        "username": usuario.username,
        "rol": usuario.rol,
    })

    return {
        "user": {
            "id": usuario.id,
            "email": usuario.email,
            "username": usuario.username,
            "rol": usuario.rol,
        },
        "token": token,
        "emprendedor": {"id": e.id, "usuario_id": e.usuario_id},
    }

# ===========================
# Logout (dummy)
# ===========================
@router.post("/logout")
def logout(request: Request):
    return {"message": "Logged out"}

# ===========================
# CRUD Usuarios (opcional)
# ===========================
@router.get("/", response_model=list[schemas.UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()

@router.put("/{usuario_id}", response_model=schemas.UsuarioResponse)
def actualizar_usuario(
    usuario_id: int,
    datos: schemas.UsuarioUpdate,  # ← ESTE es el request body
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    if current_user.id != usuario_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Campos editables (NO tocar rol acá)
    if datos.email is not None:
        usuario.email = datos.email.strip()
    if datos.username is not None:
        usuario.username = datos.username.strip()
    if datos.nombre is not None:
        usuario.nombre = (datos.nombre or "").strip() or None
    if datos.apellido is not None:
        usuario.apellido = (datos.apellido or "").strip() or None
    if datos.dni is not None:
        usuario.dni = (datos.dni or "").strip() or None

    # Cambio de contraseña opcional (si después lo usás en pestaña Seguridad)
    if datos.new_password:
        if not datos.current_password:
            raise HTTPException(status_code=400, detail="Falta current_password")
        stored_bytes = usuario.password.encode("utf-8") if isinstance(usuario.password, str) else usuario.password
        ok = bcrypt.checkpw(datos.current_password.encode("utf-8"), stored_bytes)
        if not ok:
            raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
        usuario.password = bcrypt.hashpw(datos.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        s = str(e.orig)
        if "username" in s:
            raise HTTPException(status_code=400, detail="Usuario ya en uso")
        if "email" in s:
            raise HTTPException(status_code=400, detail="Email ya en uso")
        if "dni" in s:
            raise HTTPException(status_code=400, detail="DNI ya registrado")
        raise HTTPException(status_code=400, detail="Dato duplicado")

    db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(usuario)
    db.commit()
    return {"ok": True, "mensaje": "Usuario eliminado"}
