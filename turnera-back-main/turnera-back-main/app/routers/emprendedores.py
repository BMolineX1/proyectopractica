# app/routers/emprendimiento.py
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_db
from app.auth import get_current_user
from app.utils.emprendedor import ensure_emprendedor_for_user, generate_unique_cliente_code

router = APIRouter(tags=["emprendimiento"])

# Modelo local para crear servicio sin mandar emprendedor_id desde el front
class ServicioCreateSimple(BaseModel):
    nombre: str
    duracion: int
    precio: float | None = 0

# =========================================================
# “Mi” emprendedor (protegido)
# =========================================================
@router.get("/emprendedores/mi")
def emprendedor_mi(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    e = ensure_emprendedor_for_user(db, current_user.id)
    # devolvemos también el código público
    return {
        "id": e.id,
        "usuario_id": e.usuario_id,
        "codigo_cliente": getattr(e, "codigo_cliente", None),
    }

@router.get("/usuarios/me/emprendedor")
def mi_emprendedor(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    e = ensure_emprendedor_for_user(db, current_user.id)
    return {
        "id": e.id,
        "usuario_id": e.usuario_id,
        "codigo_cliente": getattr(e, "codigo_cliente", None),
    }

# =========================================================
# Generar / Regenerar código público (protegido)
# =========================================================
@router.post("/emprendedores/{emprendedor_id}/generar-codigo")
def generar_codigo_publico(
    emprendedor_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    e = (
        db.query(models.Emprendedor)
        .filter(models.Emprendedor.id == emprendedor_id)
        .first()
    )
    if not e:
        raise HTTPException(status_code=404, detail="Emprendedor no encontrado")

    if e.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    # Reemplaza el código actual por uno nuevo alfanumérico
    e.codigo_cliente = generate_unique_cliente_code(db)
    db.commit()
    db.refresh(e)
    return {"codigo_cliente": e.codigo_cliente}

# =========================================================
# Buscar emprendedor / servicios por CÓDIGO
# =========================================================
@router.get("/emprendedores/by-codigo/{codigo}")
def emprendedor_por_codigo(codigo: str, db: Session = Depends(get_db)):
    code = (codigo or "").strip().upper()
    e = (
        db.query(models.Emprendedor)
        .filter(func.upper(models.Emprendedor.codigo_cliente) == code)
        .first()
    )
    if not e:
        raise HTTPException(status_code=404, detail="Código inválido")
    return {
        "id": e.id,
        "usuario_id": e.usuario_id,
        "negocio": getattr(e, "negocio", None),
        "descripcion": getattr(e, "descripcion", None),
        "codigo_cliente": e.codigo_cliente,
    }

@router.get("/servicios_por_codigo/{codigo}", response_model=list[schemas.ServicioResponse])
def servicios_por_codigo(codigo: str, db: Session = Depends(get_db)):
    code = (codigo or "").strip().upper()
    emprendedor = (
        db.query(models.Emprendedor)
        .filter(func.upper(models.Emprendedor.codigo_cliente) == code)
        .first()
    )
    if not emprendedor:
        raise HTTPException(status_code=404, detail="Código inválido")
    return (
        db.query(models.Servicio)
        .filter(models.Servicio.emprendedor_id == emprendedor.id)
        .all()
    )

# =========================================================
# SERVICIOS → TURNOS (consultas por servicio)
# =========================================================
@router.get("/servicios/{servicio_id}/turnos", response_model=List[schemas.TurnoResponseCreate])
def turnos_por_servicio(servicio_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Turno)
        .filter(models.Turno.servicio_id == servicio_id)
        .order_by(models.Turno.fecha_hora_inicio.asc())
        .all()
    )

@router.get("/servicios/{servicio_id}/turnos/disponibles", response_model=List[schemas.TurnoResponseCreate])
def turnos_disponibles_por_servicio(servicio_id: int, db: Session = Depends(get_db)):
    ahora = datetime.utcnow()
    turnos = (
        db.query(models.Turno)
        .filter(
            models.Turno.servicio_id == servicio_id,
            models.Turno.fecha_hora_inicio >= ahora,
        )
        .order_by(models.Turno.fecha_hora_inicio.asc())
        .all()
    )
    disponibles = []
    for t in turnos:
        reservas_count = db.query(models.Reserva).filter(models.Reserva.turno_id == t.id).count()
        if reservas_count < t.capacidad:
            disponibles.append(t)
    return disponibles

# =========================================================
# MIS servicios / MIS turnos (protegidos)
# =========================================================
@router.get("/servicios/mis-servicios", response_model=List[schemas.ServicioResponseCreate])
def mis_servicios(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    emprendedor = ensure_emprendedor_for_user(db, current_user.id)
    return (
        db.query(models.Servicio)
        .filter(models.Servicio.emprendedor_id == emprendedor.id)
        .all()
    )

@router.get("/turnos/mis-turnos", response_model=List[schemas.TurnoResponseCreate])
def mis_turnos(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    emprendedor = ensure_emprendedor_for_user(db, current_user.id)
    return (
        db.query(models.Turno)
        .join(models.Servicio, models.Turno.servicio_id == models.Servicio.id)
        .filter(models.Servicio.emprendedor_id == emprendedor.id)
        .all()
    )

# =========================================================
# EMPRENDEDORES (CRUD)
# =========================================================
@router.post("/emprendedores/", response_model=schemas.EmprendedorResponse)
def crear_emprendedor(empr: schemas.EmprendedorCreate, db: Session = Depends(get_db)):
    existente = (
        db.query(models.Emprendedor)
        .filter(models.Emprendedor.usuario_id == empr.usuario_id)
        .first()
    )
    if existente:
        for campo, valor in empr.dict(exclude={"usuario_id", "codigo_cliente"}).items():
            setattr(existente, campo, valor)
        # si no tiene código, asignamos uno
        if not getattr(existente, "codigo_cliente", None):
            existente.codigo_cliente = generate_unique_cliente_code(db)
        db.commit()
        db.refresh(existente)
        return existente

    data = empr.dict()
    # ignoramos cualquier codigo_cliente que venga del front y generamos uno
    data.pop("codigo_cliente", None)
    data["codigo_cliente"] = generate_unique_cliente_code(db)

    nuevo = models.Emprendedor(**data)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/emprendedores/", response_model=List[schemas.EmprendedorResponse])
def listar_emprendedores(db: Session = Depends(get_db)):
    return db.query(models.Emprendedor).all()

@router.get("/emprendedores/{emprendedor_id}", response_model=schemas.EmprendedorResponse)
def detalle_emprendedor(emprendedor_id: int, db: Session = Depends(get_db)):
    emprendedor = (
        db.query(models.Emprendedor)
        .filter(models.Emprendedor.id == emprendedor_id)
        .first()
    )
    if not emprendedor:
        raise HTTPException(status_code=404, detail="Emprendedor no encontrado")
    return emprendedor

@router.put("/emprendedores/{emprendedor_id}", response_model=schemas.EmprendedorResponse)
def actualizar_emprendedor(
    emprendedor_id: int, datos: schemas.EmprendedorUpdate, db: Session = Depends(get_db)
):
    emprendedor = (
        db.query(models.Emprendedor)
        .filter(models.Emprendedor.id == emprendedor_id)
        .first()
    )
    if not emprendedor:
        raise HTTPException(status_code=404, detail="Emprendedor no encontrado")

    for campo, valor in datos.dict(exclude_unset=True).items():
        setattr(emprendedor, campo, valor)

    db.commit()
    db.refresh(emprendedor)
    return emprendedor

@router.delete("/emprendedores/{emprendedor_id}")
def eliminar_emprendedor(emprendedor_id: int, db: Session = Depends(get_db)):
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

# =========================================================
# SERVICIOS
# =========================================================
@router.get("/servicios/", response_model=List[schemas.ServicioResponseCreate])
def list_servicios(db: Session = Depends(get_db)):
    return db.query(models.Servicio).all()

@router.get(
    "/emprendedores/{emprendedor_id}/servicios",
    response_model=List[schemas.ServicioResponseCreate],
)
def listar_servicios_por_emprendedor(
    emprendedor_id: int, db: Session = Depends(get_db)
):
    emprendedor = (
        db.query(models.Emprendedor)
        .filter(models.Emprendedor.id == emprendedor_id)
        .first()
    )
    if not emprendedor:
        raise HTTPException(status_code=404, detail="Emprendedor no encontrado")
    return (
        db.query(models.Servicio)
        .filter(models.Servicio.emprendedor_id == emprendedor.id)
        .all()
    )

@router.post("/mis/servicios", response_model=schemas.ServicioResponseCreate)
def crear_mi_servicio(
    data: ServicioCreateSimple,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    e = ensure_emprendedor_for_user(db, current_user.id)
    nuevo = models.Servicio(
        nombre=data.nombre,
        duracion=data.duracion,
        precio=(data.precio or 0),
        emprendedor_id=e.id,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.post("/servicios/", response_model=schemas.ServicioResponseCreate)
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

@router.get("/servicios/{servicio_id}", response_model=schemas.ServicioResponseCreate)
def detalle_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = (
        db.query(models.Servicio)
        .filter(models.Servicio.id == servicio_id)
        .first()
    )
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return servicio

# =========================================================
# TURNOS (CRUD) — con chequeo de dueño
# =========================================================
@router.post("/turnos/", response_model=schemas.TurnoResponseCreate)
def crear_turno(
    turno: schemas.TurnoCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    if current_user.rol != "emprendedor":
        raise HTTPException(status_code=403, detail="Solo emprendedores")

    servicio = db.query(models.Servicio).filter(models.Servicio.id == turno.servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    e = ensure_emprendedor_for_user(db, current_user.id)
    if servicio.emprendedor_id != e.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    nuevo = models.Turno(**turno.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/turnos/", response_model=List[schemas.TurnoResponseCreate])
def listar_turnos(db: Session = Depends(get_db)):
    return db.query(models.Turno).all()

@router.get("/turnos/{turno_id}", response_model=schemas.TurnoResponseCreate)
def detalle_turno(turno_id: int, db: Session = Depends(get_db)):
    turno = db.query(models.Turno).filter(models.Turno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return turno

@router.put("/turnos/{turno_id}", response_model=schemas.TurnoResponseCreate)
def actualizar_turno(
    turno_id: int,
    datos: schemas.TurnoBase,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    if current_user.rol != "emprendedor":
        raise HTTPException(status_code=403, detail="Solo emprendedores")

    turno = db.query(models.Turno).filter(models.Turno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    servicio = db.query(models.Servicio).filter(models.Servicio.id == turno.servicio_id).first()
    e = ensure_emprendedor_for_user(db, current_user.id)
    if servicio.emprendedor_id != e.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    for campo, valor in datos.dict().items():
        setattr(turno, campo, valor)
    db.commit()
    db.refresh(turno)
    return turno

@router.delete("/turnos/{turno_id}")
def eliminar_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    if current_user.rol != "emprendedor":
        raise HTTPException(status_code=403, detail="Solo emprendedores")

    turno = db.query(models.Turno).filter(models.Turno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    servicio = db.query(models.Servicio).filter(models.Servicio.id == turno.servicio_id).first()
    e = ensure_emprendedor_for_user(db, current_user.id)
    if servicio.emprendedor_id != e.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    db.delete(turno)
    db.commit()
    return {"ok": True, "mensaje": "Turno eliminado"}
