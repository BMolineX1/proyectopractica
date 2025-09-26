import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Request

from app.config import AuthenticationSettings, User
from app.schemas import LoginSchema, RegisterSchema
from fastapi_auth_jwt import JWTAuthBackend
from app import schemas, models

from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db



router = APIRouter(prefix="/usuarios", tags=["usuarios"])


# Initialize the Authentication Backend
auth_backend = JWTAuthBackend(
    authentication_config=AuthenticationSettings(),
    user_schema=User,
)

@router.put("/{usuario_id}/activar_emprendedor")
async def activar_emprendedor(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario.rol = "emprendedor"
    db.commit()
    db.refresh(usuario)
    
    # Crear token nuevo con rol actualizado
    token = await auth_backend.create_token({"username": usuario.username, "rol": usuario.rol})
    
    schema = schemas.UsuarioResponse.model_validate(usuario)
    
    return {"user": schema, "token": token}

@router.post("/registro")
async def sign_up(request_data: RegisterSchema, db: Session = Depends(get_db)):

    existe = db.query(models.Usuario).filter(
        (models.Usuario.username == request_data.username ) | (models.Usuario.email == request_data.email)
    ).first()

    if existe:
        raise HTTPException(status_code=400,  detail="Usuario o email ya existe")
    
    pass_hasheada = bcrypt.hashpw(request_data.password.encode(), bcrypt.gensalt())

    nuevo_usuario = models.Usuario(
        email = request_data.email,
        username=request_data.username,
        password = pass_hasheada,
        rol=request_data.rol
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    schema = schemas.UsuarioResponse.model_validate(nuevo_usuario)

    return {"message": schema }


@router.post("/login")
async def login(request_data: LoginSchema, db: Session = Depends(get_db)):

    user = db.query(models.Usuario).filter(
        models.Usuario.username == request_data.username
    ).first()

    if not user or not bcrypt.checkpw(request_data.password.encode(), user.password):
        raise HTTPException(status_code = 404, detail = "Usuario o contraseña incorrectos")

    schema = schemas.UsuarioResponse.model_validate(user)

    token = await auth_backend.create_token(
        {
            "username": user.username
        }
    )
    return {"user_schema": schema, "token": token}


@router.get("/perfil")
async def get_profile_info(request: Request):
    user: User = request.state.user
    return {"username": user.username}


@router.post("/logout")
async def logout(request: Request):
    user: User = request.state.user
    await auth_backend.invalidate_token(user.token)
    return {"message": "Logged out"}





# ==========================
#   USUARIOS
# ==========================
@router.get("/", response_model=List[schemas.UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    """
    Obtener todos los usuarios guardados.
    """
    return db.query(models.Usuario).all()


@router.get("/{usuario_id}", response_model=schemas.UsuarioResponse)
def detalle_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """
    Obtener todos los datos relacionados a un usuario, dada su ID.
    """
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put("/{usuario_id}", response_model=schemas.UsuarioResponse)
def actualizar_usuario(
    usuario_id: int, datos: schemas.UsuarioBase, db: Session = Depends(get_db)
):
    """
    Actualizar los datos de un usuario, dada su ID.
    """
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.email = datos.email
    usuario.rol = datos.rol
    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """
    Eliminar un usuario, dada su ID.
    """

    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(usuario)
    db.commit()
    return {"ok": True, "mensaje": "Usuario eliminado"}
