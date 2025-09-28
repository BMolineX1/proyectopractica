# app/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, database
from app.dependencies import get_db

# Routers
from app.routers.usuarios import router as router_usuarios
from app.routers.horarios import router as router_horarios
from app.routers.emprendedores import router as router_emprendimiento  # <<< fix: singular

# =========================================================
# App + CORS
# =========================================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin"],
)

# Incluir routers
app.include_router(router_usuarios)
app.include_router(router_horarios)
app.include_router(router_emprendimiento)

# Crear tablas
models.Base.metadata.create_all(bind=database.engine)

# =========================================================
# RESERVAS (queda en main por ahora)
# =========================================================
@app.post("/reservas/", response_model=schemas.ReservaResponse)
def crear_reserva(reserva: schemas.ReservaCreate, db: Session = Depends(get_db)):
    # 1) Turno existente
    turno = db.query(models.Turno).filter(models.Turno.id == reserva.turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    # 2) Capacidad del turno
    reservas_existentes = (
        db.query(models.Reserva).filter(models.Reserva.turno_id == turno.id).count()
    )
    if reservas_existentes >= turno.capacidad:
        raise HTTPException(status_code=400, detail="No hay lugares disponibles en este turno")

    # 3) Evitar doble reserva en el mismo turno por el mismo usuario
    ya_reservo = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.turno_id == turno.id,
            models.Reserva.usuario_id == reserva.usuario_id,
        )
        .first()
    )
    if ya_reservo:
        raise HTTPException(status_code=400, detail="Ya tenés una reserva en este turno")

    # 4) Regla NUEVA: si NO sos dueño, solo 1 reserva futura en ESA grilla (emprendedor)
    #    Identificamos el emprendedor dueño de este turno
    servicio = db.query(models.Servicio).filter(models.Servicio.id == turno.servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    emprendedor_id_del_turno = servicio.emprendedor_id

    #    Buscamos si el usuario que reserva ES el dueño de esa grilla
    usuario = db.query(models.Usuario).filter(models.Usuario.id == reserva.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    es_duenio = False
    if usuario.emprendedor and usuario.emprendedor.id == emprendedor_id_del_turno:
        es_duenio = True

    if not es_duenio:
        #    Si NO es dueño: chequear si ya tiene ALGUNA reserva futura con ese emprendedor
        ahora = datetime.datetime.utcnow()
        reserva_activa_con_mismo_emprendedor = (
            db.query(models.Reserva)
            .join(models.Turno, models.Reserva.turno_id == models.Turno.id)
            .join(models.Servicio, models.Turno.servicio_id == models.Servicio.id)
            .filter(
                models.Reserva.usuario_id == reserva.usuario_id,
                models.Servicio.emprendedor_id == emprendedor_id_del_turno,
                models.Turno.fecha_hora_inicio >= ahora,  # solo futuras
            )
            .first()
        )
        if reserva_activa_con_mismo_emprendedor:
            raise HTTPException(
                status_code=400,
                detail="Ya tenés una reserva activa con este emprendimiento",
            )

    # 5) Crear reserva
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


@app.get("/usuarios/{usuario_id}/reservas", response_model=List[schemas.ReservaOut])
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
