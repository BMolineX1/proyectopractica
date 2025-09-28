# app/routers/horarios.py
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from typing import List, Union
from datetime import datetime, time as dtime

from app.dependencies import get_db
from app.models import Horario as HorarioModel, Emprendedor
# Usa tus schemas existentes; si los tuyos difieren, ajusta los nombres:
from app.schemas import Horario as HorarioOut, HorarioCreate, HorarioUpdate

router = APIRouter(prefix="/emprendedores", tags=["horarios"])

# --- Helpers ---

DAY_MAP = {
    # inglés → español (Título)
    "monday": "Lunes", "tuesday": "Martes", "wednesday": "Miércoles",
    "thursday": "Jueves", "friday": "Viernes", "saturday": "Sábado", "sunday": "Domingo",
    # español (minúsculas) → español (Título)
    "lunes": "Lunes", "martes": "Martes", "miercoles": "Miércoles", "miércoles": "Miércoles",
    "jueves": "Jueves", "viernes": "Viernes", "sabado": "Sábado", "sábado": "Sábado", "domingo": "Domingo",
}

def ensure_emprendedor(db: Session, emprendedor_id: int):
    emp = db.get(Emprendedor, emprendedor_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Emprendedor no encontrado")
    return emp

def to_sql_time(v: Union[str, dtime]) -> dtime:
    if isinstance(v, dtime):
        return v
    v = v.strip()
    fmt = "%H:%M:%S" if v.count(":") == 2 else "%H:%M"
    return datetime.strptime(v, fmt).time()

def norm_day(d: str) -> str:
    key = d.strip().lower()
    # quita tildes para mapear "miércoles" ~ "miercoles"
    key = key.encode("ascii", "ignore").decode()  # simple de-acentuado
    return DAY_MAP.get(key, d)  # si no está, deja como vino

# --- Endpoints ---

@router.put("/{emprendedor_id}/horarios:replace", status_code=204)
@router.put("/{emprendedor_id}/horarios/replace", status_code=204)
def replace_horarios(
    emprendedor_id: int,
    horarios: List[HorarioUpdate],  # espera items con dia_semana, hora_inicio, hora_fin
    db: Session = Depends(get_db),
):
    ensure_emprendedor(db, emprendedor_id)

    # borrar todos los anteriores de ese emprendedor
    db.query(HorarioModel).filter(
        HorarioModel.emprendedor_id == emprendedor_id
    ).delete(synchronize_session=False)

    # insertar nuevos
    for h in horarios:
        db.add(HorarioModel(
            emprendedor_id = emprendedor_id,
            dia_semana     = norm_day(h.dia_semana),
            hora_inicio    = to_sql_time(h.hora_inicio),
            hora_fin       = to_sql_time(h.hora_fin),
        ))

    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{emprendedor_id}/horarios", response_model=List[HorarioOut])
def listar_horarios(emprendedor_id: int, db: Session = Depends(get_db)):
    ensure_emprendedor(db, emprendedor_id)
    return db.query(HorarioModel).filter(
        HorarioModel.emprendedor_id == emprendedor_id
    ).order_by(HorarioModel.id.asc()).all()

@router.post("/{emprendedor_id}/horarios", response_model=HorarioOut, status_code=201)
def crear_horario(emprendedor_id: int, horario: HorarioCreate, db: Session = Depends(get_db)):
    ensure_emprendedor(db, emprendedor_id)
    obj = HorarioModel(
        emprendedor_id = emprendedor_id,
        dia_semana     = norm_day(horario.dia_semana),
        hora_inicio    = to_sql_time(horario.hora_inicio),
        hora_fin       = to_sql_time(horario.hora_fin),
    )
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.put("/horarios/{horario_id}", response_model=HorarioOut)
def actualizar_horario(horario_id: int, horario: HorarioCreate, db: Session = Depends(get_db)):
    obj = db.get(HorarioModel, horario_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    obj.dia_semana  = norm_day(horario.dia_semana)
    obj.hora_inicio = to_sql_time(horario.hora_inicio)
    obj.hora_fin    = to_sql_time(horario.hora_fin)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/horarios/{horario_id}", status_code=204)
def borrar_horario(horario_id: int, db: Session = Depends(get_db)):
    obj = db.get(HorarioModel, horario_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    db.delete(obj); db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
