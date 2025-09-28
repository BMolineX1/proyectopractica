# app/main.py
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app import models, schemas, database
from app.dependencies import get_db
# Routers
from app.routers.usuarios import router as router_usuarios
from app.routers.horarios import router as router_horarios
from app.routers.emprendedores import router as router_emprendimiento  # <- nombre coherente con tu archivo

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
# RESERVAS
# =========================================================
from app.auth import get_current_user  # importa tu dependencia de auth


@app.post("/reservas/", response_model=schemas.ReservaResponse)
def crear_reserva(
    reserva: schemas.ReservaCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
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

    # 3) Evitar doble reserva en el mismo turno por el mismo usuario (del token)
    ya_reservo = (
        db.query(models.Reserva)
        .filter(
            models.Reserva.turno_id == turno.id,
            models.Reserva.usuario_id == current_user.id,
        )
        .first()
    )
    if ya_reservo:
        raise HTTPException(status_code=400, detail="Ya tenés una reserva en este turno")

    # 4) Regla: si NO sos dueño de esa grilla, permitir solo 1 reserva futura con ese emprendedor
    servicio = db.query(models.Servicio).filter(models.Servicio.id == turno.servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    emprendedor_id_del_turno = servicio.emprendedor_id

    # ¿El usuario actual es dueño de esa grilla?
    es_duenio = db.query(models.Emprendedor).filter(
        models.Emprendedor.usuario_id == current_user.id,
        models.Emprendedor.id == emprendedor_id_del_turno,
    ).first() is not None

    if not es_duenio:
        ahora = datetime.utcnow()
        reserva_activa_con_mismo_emprendedor = (
            db.query(models.Reserva)
            .join(models.Turno, models.Reserva.turno_id == models.Turno.id)
            .join(models.Servicio, models.Turno.servicio_id == models.Servicio.id)
            .filter(
                models.Reserva.usuario_id == current_user.id,
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

    # 5) Crear reserva (forzamos usuario_id = current_user.id)
    nueva = models.Reserva(turno_id=reserva.turno_id, usuario_id=current_user.id)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@app.get("/reservas/", response_model=List[schemas.ReservaResponse])
def listar_reservas(
    emprendedor_id: Optional[int] = None,
    servicio_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Devuelve reservas. Si viene emprendedor_id, filtra por dueño del servicio;
    si viene servicio_id, filtra por servicio.
    Esto permite al frontend pedir /reservas?emprendedor_id=XXX para mostrar solo los turnos de esa grilla.
    """
    q = (
        db.query(models.Reserva)
        .join(models.Turno, models.Reserva.turno_id == models.Turno.id)
        .join(models.Servicio, models.Turno.servicio_id == models.Servicio.id)
    )

    if emprendedor_id is not None:
        q = q.filter(models.Servicio.emprendedor_id == emprendedor_id)
    if servicio_id is not None:
        q = q.filter(models.Servicio.id == servicio_id)

    return q.all()


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


@app.post("/reservas/directo", response_model=schemas.ReservaResponse)
def reservar_directo(
    data: schemas.ReservaDirectaCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    # helper: llevar cualquier datetime (aware o naive) a UTC naive
    def to_utc_naive(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt  # asumimos que ya está en UTC naive
        return dt.astimezone(timezone.utc).replace(tzinfo=None)

    # 1) Servicio válido
    servicio = db.query(models.Servicio).filter(models.Servicio.id == data.servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    # 2) Emprendedor dueño del servicio
    emprendedor_id_del_turno = servicio.emprendedor_id

    # 3) Regla: si NO es dueño, solo 1 reserva futura con ese emprendedor
    es_duenio = db.query(models.Emprendedor).filter(
        models.Emprendedor.usuario_id == current_user.id,
        models.Emprendedor.id == emprendedor_id_del_turno,
    ).first() is not None

    if not es_duenio:
        ahora = datetime.utcnow()  # naive UTC
        reserva_activa_con_mismo_emprendedor = (
            db.query(models.Reserva)
            .join(models.Turno, models.Reserva.turno_id == models.Turno.id)
            .join(models.Servicio, models.Turno.servicio_id == models.Servicio.id)
            .filter(
                models.Reserva.usuario_id == current_user.id,
                models.Servicio.emprendedor_id == emprendedor_id_del_turno,
                models.Turno.fecha_hora_inicio >= ahora,  # solo futuras
            )
            .first()
        )
        if reserva_activa_con_mismo_emprendedor:
            raise HTTPException(status_code=400, detail="Ya tenés una reserva activa con este emprendimiento")

    # 4) (opcional) validar contra horarios de atención

    # 5) Evitar superposición con turnos existentes del mismo emprendedor
    inicio = to_utc_naive(data.fecha_hora_inicio)  # <-- normalizamos
    dur_min = servicio.duracion or 30
    fin_estimada = inicio + timedelta(minutes=dur_min)

    # Traemos candidatos cercanos y chequeamos solape en Python
    candidatos = (
        db.query(models.Turno)
        .join(models.Servicio, models.Turno.servicio_id == models.Servicio.id)
        .filter(
            models.Servicio.emprendedor_id == emprendedor_id_del_turno,
            models.Turno.fecha_hora_inicio >= (inicio - timedelta(hours=6)),
            models.Turno.fecha_hora_inicio <= (inicio + timedelta(hours=6)),
        )
        .all()
    )

    def turno_end(t: models.Turno) -> datetime:
        d = getattr(t, "duracion_minutos", None)
        if not d:
            if t.servicio_id == servicio.id:
                d = dur_min
            else:
                svc = db.query(models.Servicio).get(t.servicio_id)
                d = (svc.duracion if svc and svc.duracion else 30)
        return t.fecha_hora_inicio + timedelta(minutes=d)

    # Solapa si: A.start < B.end && B.start < A.end
    for t in candidatos:
        t_fin = turno_end(t)  # ambos naive
        solapa = (t.fecha_hora_inicio < fin_estimada) and (inicio < t_fin)
        if solapa:
            reservas_count = db.query(models.Reserva).filter(models.Reserva.turno_id == t.id).count()
            if reservas_count >= (t.capacidad or 1):
                raise HTTPException(status_code=400, detail="Ese horario ya está ocupado")

    # 6) Crear Turno (guardamos UTC naive)
    nuevo_turno = models.Turno(
        servicio_id=servicio.id,
        fecha_hora_inicio=inicio,      # UTC naive
        duracion_minutos=dur_min,
        capacidad=1,
        precio=servicio.precio or 0,
    )
    db.add(nuevo_turno)
    db.commit()
    db.refresh(nuevo_turno)

    # 7) Crear Reserva inmediata para el usuario actual
    nueva_reserva = models.Reserva(turno_id=nuevo_turno.id, usuario_id=current_user.id)
    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)

    return nueva_reserva
