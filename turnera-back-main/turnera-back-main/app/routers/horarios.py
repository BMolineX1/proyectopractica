from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.crud import horarios as crud
from app.schemas import Horario, HorarioCreate, HorarioUpdate

router = APIRouter(prefix="/emprendedores", tags=["horarios"])

# Obtener horarios de un emprendimiento específico
@router.put("/emprendimiento/{emprendimiento_id}")
def update_horarios(emprendimiento_id: int, horarios: list[HorarioUpdate], db: Session = Depends(get_db)):
    # Primero borro los anteriores
    db.query(Horario).filter(Horario.emprendimiento_id == emprendimiento_id).delete()
    # Inserto los nuevos
    for h in horarios:
        nuevo = Horario(
            dia_semana=h.dia_semana,
            hora_inicio=h.hora_inicio,
            hora_fin=h.hora_fin,
            emprendimiento_id=emprendimiento_id
        )
        db.add(nuevo)
    db.commit()
    return {"message": "Horarios actualizados"}


@router.get("/{emprendedor_id}/horarios", response_model=list[Horario])
def listar_horarios(emprendedor_id: int, db: Session = Depends(get_db)):
    return crud.get_horarios(db, emprendedor_id)

@router.post("/{emprendedor_id}/horarios", response_model=Horario)
def crear_horario(emprendedor_id: int, horario: HorarioCreate, db: Session = Depends(get_db)):
    return crud.create_horario(db, emprendedor_id, horario)

@router.put("/horarios/{horario_id}", response_model=Horario)
def actualizar_horario(horario_id: int, horario: HorarioCreate, db: Session = Depends(get_db)):
    updated = crud.update_horario(db, horario_id, horario)
    if not updated:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    return updated

@router.delete("/horarios/{horario_id}")
def borrar_horario(horario_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_horario(db, horario_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    return {"detail": "Horario eliminado correctamente"}