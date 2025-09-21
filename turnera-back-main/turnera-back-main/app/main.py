from fastapi import FastAPI, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, database
from fastapi.middleware.cors import CORSMiddleware
import secrets
from passlib.context import CryptContext

from fastapi_auth_jwt import JWTAuthenticationMiddleware
from app.routers.usuarios import auth_backend
from app.dependencies import get_db
from app.routers.usuarios import router as routerUsuarios
from app.routers.emprendedores import router as routerEmprendedores




# Create FastAPI app and add middleware
app = FastAPI()
app.include_router(routerEmprendedores)
app.add_middleware(
    JWTAuthenticationMiddleware,
    backend=auth_backend,
    exclude_urls=["/usuarios/registro", "/usuarios/login"],
)

origins = [
    "http://localhost:5173",  # tu frontend en React
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Lista de orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],         # Métodos HTTP permitidos
    allow_headers=["*"],         # Headers permitidos
)
models.Base.metadata.create_all(bind=database.engine)


app.include_router(routerUsuarios)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==========================
#   EMPRENDEDORES
# ==========================
@app.post("/emprendedores/", response_model=schemas.EmprendedorResponse)
def crear_emprendedor(
    emprendedor: schemas.EmprendedorCreate, db: Session = Depends(get_db)
):
    """
    Crear un nuevo emprendedor. Requiere que exista un usuario.
    """
    usuario = (
        db.query(models.Usuario)
        .filter(models.Usuario.id == emprendedor.usuario_id)
        .first()
    )
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if usuario.rol != "emprendedor":
        raise HTTPException(status_code=400, detail="El usuario no es un emprendedor")

    nuevo = models.Emprendedor(**emprendedor.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@app.get("/emprendedores/", response_model=List[schemas.EmprendedorResponse])
def listar_emprendedores(db: Session = Depends(get_db)):
    """
    Obtener todos los emprendedores.
    """
    return db.query(models.Emprendedor).all()


@app.get("/emprendedores/{emprendedor_id}", response_model=schemas.EmprendedorResponse)
def detalle_emprendedor(emprendedor_id: int, db: Session = Depends(get_db)):
    """
    Obtener todos los datos de un emprendedor
    """
    emprendedor = (
        db.query(models.Emprendedor)
        .filter(models.Emprendedor.id == emprendedor_id)
        .first()
    )
    if not emprendedor:
        raise HTTPException(status_code=404, detail="Emprendedor no encontrado")
    return emprendedor


@app.put("/emprendedores/{emprendedor_id}", response_model=schemas.EmprendedorResponse)
def actualizar_emprendedor(
    emprendedor_id: int, datos: schemas.EmprendedorBase, db: Session = Depends(get_db)
):
    """
    Actualizar un emprendedor, dada su id.
    """
    emprendedor = (
        db.query(models.Emprendedor)
        .filter(models.Emprendedor.id == emprendedor_id)
        .first()
    )
    if not emprendedor:
        raise HTTPException(status_code=404, detail="Emprendedor no encontrado")
    for campo, valor in datos.dict().items():
        setattr(emprendedor, campo, valor)
    db.commit()
    db.refresh(emprendedor)
    return emprendedor


@app.delete("/emprendedores/{emprendedor_id}")
def eliminar_emprendedor(emprendedor_id: int, db: Session = Depends(get_db)):
    """
    Eliminar un emprendedor, dada su ID.
    """
    emprendedor = (
        db.query(models.Emprendedor)
        .filter(models.Emprendedor.id == emprendedor_id)
        .first()
    )
    if not emprendedor:
        raise HTTPException(status_code=404, detail="Emprendedor no encontrado")
    db.delete(emprendedor)
    db.commit()
    return {"ok": True, "mensaje": "Emprendedor eliminado"}


@app.get(
    "/emprendedores/{emprendedor_id}/servicios",
    response_model=list[schemas.ServicioResponse],
)
def listar_servicios_y_turnos(emprendedor_id: int, db: Session = Depends(get_db)):
    """
    Dada la Id de un emprendedor, listar todos los servicios que tiene disponibles.
    """
    emprendedor = (
        db.query(models.Usuario)
        .filter(
            models.Usuario.id == emprendedor_id, models.Usuario.rol == "emprendedor"
        )
        .first()
    )
    if not emprendedor:
        raise HTTPException(status_code=404, detail="Emprendedor no encontrado")

    servicios = (
        db.query(models.Servicio)
        .filter(models.Servicio.emprendedor_id == emprendedor_id)
        .all()
    )
    return servicios


# ==========================
#   SERVICIOS
# ==========================
@app.post("/servicios/", response_model=schemas.ServicioResponseCreate)
def crear_servicio(servicio: schemas.ServicioCreate, db: Session = Depends(get_db)):
    emprendedor = (
        db.query(models.Emprendedor)
        .filter(models.Emprendedor.id == servicio.emprendedor_id)
        .first()
    )
    if not emprendedor:
        raise HTTPException(status_code=404, detail="Emprendedor no encontrado")

    nuevo = models.Servicio(**servicio.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo



@app.get("/servicios/{servicio_id}", response_model=schemas.ServicioResponseCreate)
def detalle_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = (
        db.query(models.Servicio).filter(models.Servicio.id == servicio_id).first()
    )
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return servicio


@app.put("/servicios/{servicio_id}", response_model=schemas.ServicioResponseCreate)
def actualizar_servicio(
    servicio_id: int, datos: schemas.ServicioBase, db: Session = Depends(get_db)
):
    servicio = (
        db.query(models.Servicio).filter(models.Servicio.id == servicio_id).first()
    )
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    for campo, valor in datos.dict().items():
        setattr(servicio, campo, valor)
    db.commit()
    db.refresh(servicio)
    return servicio


@app.delete("/servicios/{servicio_id}")
def eliminar_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = (
        db.query(models.Servicio).filter(models.Servicio.id == servicio_id).first()
    )
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    db.delete(servicio)
    db.commit()
    return {"ok": True, "mensaje": "Servicio eliminado"}


# ==========================
#   TURNOS
# ==========================
@app.post("/turnos/", response_model=schemas.TurnoResponseCreate)
def crear_turno(turno: schemas.TurnoCreate, db: Session = Depends(get_db)):
    servicio = (
        db.query(models.Servicio)
        .filter(models.Servicio.id == turno.servicio_id)
        .first()
    )
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    nuevo = models.Turno(**turno.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@app.get("/turnos/", response_model=List[schemas.TurnoResponseCreate])
def listar_turnos(db: Session = Depends(get_db)):
    return db.query(models.Turno).all()


@app.get("/turnos/{turno_id}", response_model=schemas.TurnoResponseCreate)
def detalle_turno(turno_id: int, db: Session = Depends(get_db)):
    turno = db.query(models.Turno).filter(models.Turno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return turno


@app.put("/turnos/{turno_id}", response_model=schemas.TurnoResponseCreate)
def actualizar_turno(
    turno_id: int, datos: schemas.TurnoBase, db: Session = Depends(get_db)
):
    turno = db.query(models.Turno).filter(models.Turno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    for campo, valor in datos.dict().items():
        setattr(turno, campo, valor)
    db.commit()
    db.refresh(turno)
    return turno


@app.delete("/turnos/{turno_id}")
def eliminar_turno(turno_id: int, db: Session = Depends(get_db)):
    turno = db.query(models.Turno).filter(models.Turno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    db.delete(turno)
    db.commit()
    return {"ok": True, "mensaje": "Turno eliminado"}


# ==========================
#   RESERVAS
# ==========================
@app.post("/reservas/", response_model=schemas.ReservaResponse)
def crear_reserva(reserva: schemas.ReservaCreate, db: Session = Depends(get_db)):
    turno = db.query(models.Turno).filter(models.Turno.id == reserva.turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    # Chequear capacidad
    reservas_existentes = (
        db.query(models.Reserva).filter(models.Reserva.turno_id == turno.id).count()
    )
    if reservas_existentes >= turno.capacidad:
        raise HTTPException(
            status_code=400, detail="No hay lugares disponibles en este turno"
        )

    # Chequear si el usuario ya reservó este turno
    ya_reservo = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.turno_id == turno.id,
            models.Reserva.usuario_id == reserva.usuario_id,
        )
        .first()
    )
    if ya_reservo:
        raise HTTPException(status_code=400, detail="El usuario ya reservó este turno")

    nueva = models.Reserva(**reserva.dict())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@app.get("/reservas/", response_model=List[schemas.ReservaResponse])
def listar_reservas(db: Session = Depends(get_db)):
    return db.query(models.Reserva).all()


@app.get("/reservas/{reserva_id}", response_model=schemas.ReservaResponse)
def detalle_reserva(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva


@app.delete("/reservas/{reserva_id}")
def eliminar_reserva(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    db.delete(reserva)
    db.commit()
    return {"ok": True, "mensaje": "Reserva eliminada"}


@app.get("/usuarios/{usuario_id}/reservas", response_model=list[schemas.ReservaOut])
def listar_reservas_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    reservas = (
        db.query(models.Reserva)
        .join(models.Turno, models.Reserva.turno_id == models.Turno.id)
        .join(models.Servicio, models.Turno.servicio_id == models.Servicio.id)
        .filter(models.Reserva.usuario_id == usuario_id)
        .all()
    )

    resultados = [
        schemas.ReservaOut(
            id=r.id,
            turno_id=r.turno.id,
            fecha_hora_inicio=r.turno.fecha_hora_inicio,
            precio=r.turno.precio,
            servicio_nombre=r.turno.servicio.nombre,
            emprendedor_id=r.turno.servicio.emprendedor_id,
        )
        for r in reservas
    ]
    return resultados

